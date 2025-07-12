#include <iostream>
#include <vector>
#include <map>
#include <chrono>
#include <thread>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <cmath>
#include <random>
#include <memory>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <functional>
#include <filesystem>
#include <json/json.h>

namespace fs = std::filesystem;

// Configuration structure
struct Config {
    struct Analysis {
        bool enabled = true;
        bool ml_enabled = true;
        double sensitivity = 0.1;
        int time_window = 300;
        int min_data_points = 10;
        int max_data_points = 10000;
        int update_interval = 60;
        int batch_size = 100;
        double confidence_threshold = 0.8;
    } analysis;

    struct Thresholds {
        int normal = 50;
        int warning = 100;
        int critical = 200;
        int emergency = 500;
        int baseline = 30;
        double spike_threshold = 2.0;
        double trend_threshold = 0.1;
    } thresholds;

    struct MLModel {
        std::string type = "isolation_forest";
        double contamination = 0.1;
        int n_estimators = 100;
        std::string max_samples = "auto";
        int random_state = 42;
        int n_jobs = -1;
        double max_features = 1.0;
        bool bootstrap = false;
        bool warm_start = false;
        int verbose = 0;
    } ml_model;
};

// Traffic data structure
struct TrafficData {
    std::chrono::system_clock::time_point timestamp;
    double value;
    std::string source_ip;
    std::string destination_ip;
    std::string protocol;
    int port;
    size_t bytes_sent;
    size_t bytes_received;
    size_t packets_sent;
    size_t packets_received;
};

// Features structure
struct Features {
    double mean = 0.0;
    double std = 0.0;
    double max = 0.0;
    double min = 0.0;
    double median = 0.0;
    double q25 = 0.0;
    double q75 = 0.0;
    double rate_of_change = 0.0;
};

// Pattern structure
struct Pattern {
    std::string type;
    int count = 0;
    double max_value = 0.0;
    std::vector<std::chrono::system_clock::time_point> timestamps;
    double slope = 0.0;
};

// Threat level enum
enum class ThreatLevel {
    NORMAL,
    NOTICE,
    WARNING,
    CRITICAL,
    EMERGENCY
};

// Traffic Analyzer class
class TrafficAnalyzer {
private:
    Config config;
    std::vector<TrafficData> traffic_history;
    std::mutex history_mutex;
    std::vector<double> model_data;
    std::vector<double> scaler_data;
    std::mt19937 rng;
    std::ofstream log_file;
    std::string rules_dir;
    bool model_loaded = false;

    // ML model simulation
    struct MLModel {
        std::vector<double> contamination_scores;
        double sensitivity;
        bool trained = false;
    } ml_model;

public:
    TrafficAnalyzer() : rng(std::random_device{}()) {
        initialize();
    }

    ~TrafficAnalyzer() {
        if (log_file.is_open()) {
            log_file.close();
        }
    }

private:
    void initialize() {
        // Create rules directory
        rules_dir = "rules";
        fs::create_directories(rules_dir);

        // Initialize logging
        std::string log_path = rules_dir + "/traffic_analyzer.log";
        log_file.open(log_path, std::ios::app);
        
        // Load or create ML model
        load_model();
        
        // Initialize ML model
        ml_model.sensitivity = config.analysis.sensitivity;
        ml_model.contamination_scores.resize(1000, 0.0);
        
        log("TrafficAnalyzer initialized successfully");
    }

    void log(const std::string& message) {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        std::string timestamp = std::ctime(&time_t);
        timestamp.pop_back(); // Remove newline
        
        std::string log_message = "[" + timestamp + "] " + message + "\n";
        
        if (log_file.is_open()) {
            log_file << log_message;
            log_file.flush();
        }
        
        std::cout << log_message;
    }

    void load_model() {
        std::string model_path = rules_dir + "/traffic_model.bin";
        
        if (fs::exists(model_path)) {
            try {
                std::ifstream file(model_path, std::ios::binary);
                if (file.is_open()) {
                    // Read model data
                    size_t size;
                    file.read(reinterpret_cast<char*>(&size), sizeof(size));
                    model_data.resize(size);
                    file.read(reinterpret_cast<char*>(model_data.data()), size * sizeof(double));
                    
                    model_loaded = true;
                    log("ML model loaded successfully");
                }
            } catch (const std::exception& e) {
                log("Error loading ML model: " + std::string(e.what()));
                create_new_model();
            }
        } else {
            create_new_model();
        }
    }

    void create_new_model() {
        model_data.clear();
        model_data.resize(1000, 0.0);
        
        // Initialize with random data
        std::uniform_real_distribution<double> dist(0.0, 1.0);
        for (auto& value : model_data) {
            value = dist(rng);
        }
        
        model_loaded = true;
        log("New ML model created");
    }

    void save_model() {
        try {
            std::string model_path = rules_dir + "/traffic_model.bin";
            std::ofstream file(model_path, std::ios::binary);
            
            if (file.is_open()) {
                size_t size = model_data.size();
                file.write(reinterpret_cast<const char*>(&size), sizeof(size));
                file.write(reinterpret_cast<const char*>(model_data.data()), size * sizeof(double));
                log("ML model saved successfully");
            }
        } catch (const std::exception& e) {
            log("Error saving ML model: " + std::string(e.what()));
        }
    }

public:
    Features extract_features(const std::vector<double>& traffic_data) {
        Features features;
        
        if (traffic_data.empty()) {
            return features;
        }

        // Calculate basic statistics
        double sum = 0.0;
        double sum_sq = 0.0;
        features.min = traffic_data[0];
        features.max = traffic_data[0];

        for (double value : traffic_data) {
            sum += value;
            sum_sq += value * value;
            features.min = std::min(features.min, value);
            features.max = std::max(features.max, value);
        }

        features.mean = sum / traffic_data.size();
        
        // Calculate standard deviation
        double variance = (sum_sq / traffic_data.size()) - (features.mean * features.mean);
        features.std = std::sqrt(std::max(0.0, variance));

        // Calculate percentiles
        std::vector<double> sorted_data = traffic_data;
        std::sort(sorted_data.begin(), sorted_data.end());
        
        features.median = sorted_data[sorted_data.size() / 2];
        features.q25 = sorted_data[sorted_data.size() / 4];
        features.q75 = sorted_data[3 * sorted_data.size() / 4];

        // Calculate rate of change
        if (traffic_data.size() > 1) {
            double total_change = 0.0;
            for (size_t i = 1; i < traffic_data.size(); ++i) {
                total_change += traffic_data[i] - traffic_data[i - 1];
            }
            features.rate_of_change = total_change / (traffic_data.size() - 1);
        }

        return features;
    }

    std::pair<bool, double> analyze_traffic(double current_traffic) {
        std::lock_guard<std::mutex> lock(history_mutex);

        // Add current traffic to history
        TrafficData data;
        data.timestamp = std::chrono::system_clock::now();
        data.value = current_traffic;
        
        traffic_history.push_back(data);

        // Clean old data
        auto cutoff_time = std::chrono::system_clock::now() - 
                          std::chrono::seconds(config.analysis.time_window);
        
        traffic_history.erase(
            std::remove_if(traffic_history.begin(), traffic_history.end(),
                [cutoff_time](const TrafficData& d) {
                    return d.timestamp < cutoff_time;
                }),
            traffic_history.end()
        );

        // Extract traffic values
        std::vector<double> traffic_values;
        for (const auto& entry : traffic_history) {
            traffic_values.push_back(entry.value);
        }

        // Extract features
        Features features = extract_features(traffic_values);

        // Predict anomaly
        if (config.analysis.ml_enabled) {
            return predict_anomaly_ml(features);
        } else {
            return predict_anomaly_basic(features);
        }
    }

private:
    std::pair<bool, double> predict_anomaly_ml(const Features& features) {
        // Simulate ML prediction
        double score = calculate_anomaly_score(features);
        bool is_anomaly = score < -config.analysis.sensitivity;
        
        return {is_anomaly, std::abs(score)};
    }

    std::pair<bool, double> predict_anomaly_basic(const Features& features) {
        bool is_anomaly = (features.mean > config.thresholds.warning ||
                          features.max > config.thresholds.critical);
        
        double score = features.mean / config.thresholds.warning;
        
        return {is_anomaly, score};
    }

    double calculate_anomaly_score(const Features& features) {
        // Simulate isolation forest scoring
        double score = 0.0;
        
        // Combine features with weights
        score += features.mean * 0.3;
        score += features.std * 0.2;
        score += features.max * 0.2;
        score += features.rate_of_change * 0.3;
        
        // Normalize score
        score = (score - 50.0) / 25.0; // Assuming normal range
        
        return -score; // Negative for anomalies
    }

public:
    std::vector<Pattern> detect_patterns(const std::vector<TrafficData>& traffic_history) {
        std::vector<Pattern> patterns;

        if (traffic_history.size() < 10) {
            return patterns;
        }

        // Extract values
        std::vector<double> values;
        std::vector<std::chrono::system_clock::time_point> timestamps;
        
        for (const auto& entry : traffic_history) {
            values.push_back(entry.value);
            timestamps.push_back(entry.timestamp);
        }

        // Detect spikes
        detect_spikes(values, timestamps, patterns);

        // Detect trends
        detect_trends(values, timestamps, patterns);

        return patterns;
    }

private:
    void detect_spikes(const std::vector<double>& values, 
                      const std::vector<std::chrono::system_clock::time_point>& timestamps,
                      std::vector<Pattern>& patterns) {
        if (values.size() < 5) return;

        // Calculate rolling mean and std
        std::vector<double> rolling_mean, rolling_std;
        int window = 5;

        for (size_t i = window; i < values.size(); ++i) {
            double sum = 0.0, sum_sq = 0.0;
            for (int j = i - window; j < i; ++j) {
                sum += values[j];
                sum_sq += values[j] * values[j];
            }
            
            double mean = sum / window;
            double variance = (sum_sq / window) - (mean * mean);
            double std = std::sqrt(std::max(0.0, variance));
            
            rolling_mean.push_back(mean);
            rolling_std.push_back(std);
        }

        // Detect anomalies
        for (size_t i = 0; i < rolling_mean.size(); ++i) {
            double diff = std::abs(values[i + window] - rolling_mean[i]);
            if (diff > 2 * rolling_std[i]) {
                Pattern pattern;
                pattern.type = "spike";
                pattern.count = 1;
                pattern.max_value = values[i + window];
                pattern.timestamps.push_back(timestamps[i + window]);
                patterns.push_back(pattern);
            }
        }
    }

    void detect_trends(const std::vector<double>& values,
                      const std::vector<std::chrono::system_clock::time_point>& timestamps,
                      std::vector<Pattern>& patterns) {
        if (values.size() < 30) return;

        // Calculate trend using linear regression
        double sum_x = 0.0, sum_y = 0.0, sum_xy = 0.0, sum_x2 = 0.0;
        int n = values.size();

        for (int i = 0; i < n; ++i) {
            sum_x += i;
            sum_y += values[i];
            sum_xy += i * values[i];
            sum_x2 += i * i;
        }

        double slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x);

        if (std::abs(slope) > config.thresholds.trend_threshold) {
            Pattern pattern;
            pattern.type = "trend";
            pattern.slope = slope;
            patterns.push_back(pattern);
        }
    }

public:
    std::string save_analysis(const Json::Value& analysis_data) {
        try {
            auto now = std::chrono::system_clock::now();
            auto time_t = std::chrono::system_clock::to_time_t(now);
            
            std::stringstream ss;
            ss << "analysis_" << std::put_time(std::localtime(&time_t), "%Y%m%d_%H%M%S") << ".json";
            
            std::string filename = ss.str();
            std::string filepath = rules_dir + "/" + filename;

            Json::StyledWriter writer;
            std::ofstream file(filepath);
            file << writer.write(analysis_data);
            
            log("Analysis saved to " + filepath);
            return filepath;
        } catch (const std::exception& e) {
            log("Error saving analysis: " + std::string(e.what()));
            return "";
        }
    }

    ThreatLevel get_threat_level(double anomaly_score) {
        if (anomaly_score > 0.8) return ThreatLevel::CRITICAL;
        if (anomaly_score > 0.6) return ThreatLevel::WARNING;
        if (anomaly_score > 0.4) return ThreatLevel::NOTICE;
        return ThreatLevel::NORMAL;
    }

    bool update_model(const std::vector<TrafficData>& new_data) {
        if (new_data.size() < 100) {
            return false;
        }

        try {
            std::vector<double> values;
            for (const auto& entry : new_data) {
                values.push_back(entry.value);
            }

            // Update model data (simplified)
            for (size_t i = 0; i < std::min(values.size(), model_data.size()); ++i) {
                model_data[i] = (model_data[i] + values[i]) / 2.0;
            }

            save_model();
            log("ML model updated successfully");
            return true;
        } catch (const std::exception& e) {
            log("Error updating model: " + std::string(e.what()));
            return false;
        }
    }

    // Configuration methods
    void set_sensitivity(double sensitivity) {
        config.analysis.sensitivity = sensitivity;
        ml_model.sensitivity = sensitivity;
    }

    double get_sensitivity() const {
        return config.analysis.sensitivity;
    }

    void set_ml_enabled(bool enabled) {
        config.analysis.ml_enabled = enabled;
    }

    bool is_ml_enabled() const {
        return config.analysis.ml_enabled;
    }

    // Statistics methods
    size_t get_history_size() const {
        std::lock_guard<std::mutex> lock(history_mutex);
        return traffic_history.size();
    }

    std::vector<TrafficData> get_recent_traffic(int count = 100) const {
        std::lock_guard<std::mutex> lock(history_mutex);
        
        std::vector<TrafficData> result;
        size_t start = (traffic_history.size() > count) ? 
                      traffic_history.size() - count : 0;
        
        for (size_t i = start; i < traffic_history.size(); ++i) {
            result.push_back(traffic_history[i]);
        }
        
        return result;
    }
};

// Main function for testing
int main() {
    TrafficAnalyzer analyzer;
    
    // Simulate traffic data
    std::random_device rd;
    std::mt19937 gen(rd());
    std::normal_distribution<double> normal_dist(50.0, 10.0);
    std::uniform_real_distribution<double> anomaly_dist(100.0, 200.0);
    
    for (int i = 0; i < 100; ++i) {
        double traffic_value;
        
        // Simulate occasional anomalies
        if (i % 20 == 0) {
            traffic_value = anomaly_dist(gen);
        } else {
            traffic_value = normal_dist(gen);
        }
        
        auto [is_anomaly, score] = analyzer.analyze_traffic(traffic_value);
        
        if (is_anomaly) {
            std::cout << "ANOMALY DETECTED! Score: " << score << std::endl;
        }
        
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    
    return 0;
} 