#include <iostream>
#include <fstream>
#include <string>
#include <map>
#include <vector>
#include <memory>
#include <filesystem>
#include <json/json.h>
#include <chrono>
#include <thread>
#include <mutex>
#include <regex>
#include <algorithm>

namespace fs = std::filesystem;

// Configuration class
class Config {
private:
    Json::Value config_data;
    std::string config_file_path;
    std::mutex config_mutex;
    std::string environment = "development";

    // Paths
    std::string base_dir;
    std::string rules_dir;
    std::string data_dir;
    std::string logs_dir;
    std::string plugins_dir;
    std::string reports_dir;
    std::string backup_dir;
    std::string temp_dir;

public:
    Config() {
        initialize();
    }

    Config(const std::string& config_file) : config_file_path(config_file) {
        initialize();
    }

    ~Config() = default;

private:
    void initialize() {
        // Set base directory
        base_dir = fs::current_path().string();
        
        // Set default paths
        rules_dir = base_dir + "/rules";
        data_dir = base_dir + "/data";
        logs_dir = base_dir + "/logs";
        plugins_dir = base_dir + "/plugins";
        reports_dir = base_dir + "/reports";
        backup_dir = base_dir + "/backups";
        temp_dir = base_dir + "/temp";

        // Create directories
        create_directories();

        // Load configuration
        if (!config_file_path.empty()) {
            load_from_file(config_file_path);
        } else {
            load_default_config();
        }
    }

    void create_directories() {
        std::vector<std::string> dirs = {
            rules_dir, data_dir, logs_dir, plugins_dir,
            reports_dir, backup_dir, temp_dir
        };

        for (const auto& dir : dirs) {
            fs::create_directories(dir);
        }
    }

    void load_default_config() {
        // General configuration
        config_data["general"]["debug"] = true;
        config_data["general"]["log_level"] = "INFO";
        config_data["general"]["max_log_size"] = 10485760; // 10 MB
        config_data["general"]["backup_count"] = 5;
        config_data["general"]["timezone"] = "Europe/Paris";

        // Analysis configuration
        config_data["analysis"]["enabled"] = true;
        config_data["analysis"]["ml_enabled"] = true;
        config_data["analysis"]["sensitivity"] = 0.1;
        config_data["analysis"]["time_window"] = 300;
        config_data["analysis"]["min_data_points"] = 10;
        config_data["analysis"]["max_data_points"] = 10000;
        config_data["analysis"]["update_interval"] = 60;
        config_data["analysis"]["batch_size"] = 100;
        config_data["analysis"]["confidence_threshold"] = 0.8;

        // Thresholds
        config_data["thresholds"]["normal"] = 50;
        config_data["thresholds"]["warning"] = 100;
        config_data["thresholds"]["critical"] = 200;
        config_data["thresholds"]["emergency"] = 500;
        config_data["thresholds"]["baseline"] = 30;
        config_data["thresholds"]["spike_threshold"] = 2.0;
        config_data["thresholds"]["trend_threshold"] = 0.1;

        // ML Model configuration
        config_data["ml_model"]["type"] = "isolation_forest";
        config_data["ml_model"]["contamination"] = 0.1;
        config_data["ml_model"]["n_estimators"] = 100;
        config_data["ml_model"]["max_samples"] = "auto";
        config_data["ml_model"]["random_state"] = 42;
        config_data["ml_model"]["n_jobs"] = -1;
        config_data["ml_model"]["max_features"] = 1.0;
        config_data["ml_model"]["bootstrap"] = false;
        config_data["ml_model"]["warm_start"] = false;
        config_data["ml_model"]["verbose"] = 0;

        // Patterns configuration
        config_data["patterns"]["detect_spikes"] = true;
        config_data["patterns"]["detect_trends"] = true;
        config_data["patterns"]["detect_cycles"] = true;
        config_data["patterns"]["spike_window"] = 10;
        config_data["patterns"]["trend_window"] = 30;
        config_data["patterns"]["cycle_window"] = 1440;
        config_data["patterns"]["min_spike_height"] = 1.5;
        config_data["patterns"]["min_trend_slope"] = 0.05;

        // Alerts configuration
        config_data["alerts"]["enabled"] = true;
        config_data["alerts"]["email_enabled"] = false;
        config_data["alerts"]["sms_enabled"] = false;
        config_data["alerts"]["webhook_enabled"] = false;
        config_data["alerts"]["notification_interval"] = 300;
        config_data["alerts"]["escalation_time"] = 1800;
        config_data["alerts"]["max_alerts_per_hour"] = 10;
        config_data["alerts"]["alert_cooldown"] = 600;

        // Notifications configuration
        config_data["notifications"]["email"]["smtp_server"] = "smtp.gmail.com";
        config_data["notifications"]["email"]["smtp_port"] = 587;
        config_data["notifications"]["email"]["use_tls"] = true;
        config_data["notifications"]["email"]["username"] = "";
        config_data["notifications"]["email"]["password"] = "";
        config_data["notifications"]["email"]["from_address"] = "";
        config_data["notifications"]["email"]["to_addresses"] = Json::Value(Json::arrayValue);
        config_data["notifications"]["email"]["subject_prefix"] = "[TRAFFIC ALERT]";

        config_data["notifications"]["webhook"]["url"] = "";
        config_data["notifications"]["webhook"]["method"] = "POST";
        config_data["notifications"]["webhook"]["headers"]["Content-Type"] = "application/json";
        config_data["notifications"]["webhook"]["headers"]["Authorization"] = "";
        config_data["notifications"]["webhook"]["timeout"] = 30;

        config_data["notifications"]["slack"]["webhook_url"] = "";
        config_data["notifications"]["slack"]["channel"] = "#alerts";
        config_data["notifications"]["slack"]["username"] = "Traffic Monitor";
        config_data["notifications"]["slack"]["icon_emoji"] = ":warning:";

        // Database configuration
        config_data["database"]["type"] = "sqlite";
        config_data["database"]["path"] = "traffic_data.db";
        config_data["database"]["host"] = "localhost";
        config_data["database"]["port"] = 5432;
        config_data["database"]["name"] = "traffic_analysis";
        config_data["database"]["username"] = "";
        config_data["database"]["password"] = "";
        config_data["database"]["pool_size"] = 10;
        config_data["database"]["max_overflow"] = 20;
        config_data["database"]["echo"] = false;

        // Storage configuration
        config_data["storage"]["data_retention_days"] = 30;
        config_data["storage"]["backup_enabled"] = true;
        config_data["storage"]["backup_interval"] = 86400;
        config_data["storage"]["compression_enabled"] = true;
        config_data["storage"]["archive_enabled"] = true;
        config_data["storage"]["archive_after_days"] = 7;

        // Security configuration
        config_data["security"]["encryption_enabled"] = true;
        config_data["security"]["encryption_key"] = "";
        config_data["security"]["hash_algorithm"] = "sha256";
        config_data["security"]["session_timeout"] = 3600;
        config_data["security"]["max_login_attempts"] = 3;
        config_data["security"]["lockout_duration"] = 1800;
        config_data["security"]["require_ssl"] = true;
        config_data["security"]["allowed_ips"] = Json::Value(Json::arrayValue);
        config_data["security"]["blocked_ips"] = Json::Value(Json::arrayValue);

        // Performance configuration
        config_data["performance"]["max_threads"] = 4;
        config_data["performance"]["queue_size"] = 1000;
        config_data["performance"]["timeout"] = 30;
        config_data["performance"]["retry_attempts"] = 3;
        config_data["performance"]["retry_delay"] = 5;
        config_data["performance"]["cache_enabled"] = true;
        config_data["performance"]["cache_size"] = 1000;
        config_data["performance"]["cache_ttl"] = 300;

        // Reports configuration
        config_data["reports"]["enabled"] = true;
        config_data["reports"]["auto_generate"] = true;
        config_data["reports"]["schedule"] = "0 0 * * *";
        config_data["reports"]["format"] = "pdf";
        config_data["reports"]["include_charts"] = true;
        config_data["reports"]["include_anomalies"] = true;
        config_data["reports"]["include_statistics"] = true;
        config_data["reports"]["email_reports"] = false;

        // Plugins configuration
        config_data["plugins"]["enabled"] = true;
        config_data["plugins"]["plugin_dir"] = "plugins";
        config_data["plugins"]["auto_load"] = true;
        config_data["plugins"]["reload_on_change"] = true;
        config_data["plugins"]["plugin_timeout"] = 30;

        // Monitoring configuration
        config_data["monitoring"]["health_check_interval"] = 60;
        config_data["monitoring"]["metrics_enabled"] = true;
        config_data["monitoring"]["metrics_port"] = 8080;
        config_data["monitoring"]["prometheus_enabled"] = false;
        config_data["monitoring"]["grafana_enabled"] = false;
        config_data["monitoring"]["dashboard_url"] = "";

        // Paths configuration
        config_data["paths"]["base_dir"] = base_dir;
        config_data["paths"]["rules_dir"] = rules_dir;
        config_data["paths"]["data_dir"] = data_dir;
        config_data["paths"]["logs_dir"] = logs_dir;
        config_data["paths"]["plugins_dir"] = plugins_dir;
        config_data["paths"]["reports_dir"] = reports_dir;
        config_data["paths"]["backup_dir"] = backup_dir;
        config_data["paths"]["temp_dir"] = temp_dir;
    }

public:
    bool load_from_file(const std::string& filename) {
        try {
            std::ifstream file(filename);
            if (!file.is_open()) {
                std::cerr << "Error: Could not open config file: " << filename << std::endl;
                return false;
            }

            Json::Reader reader;
            if (!reader.parse(file, config_data)) {
                std::cerr << "Error: Could not parse config file: " << filename << std::endl;
                return false;
            }

            std::cout << "Configuration loaded from: " << filename << std::endl;
            return true;
        } catch (const std::exception& e) {
            std::cerr << "Error loading configuration: " << e.what() << std::endl;
            return false;
        }
    }

    bool save_to_file(const std::string& filename = "") {
        try {
            std::string file_path = filename.empty() ? 
                (base_dir + "/config.json") : filename;

            Json::StyledWriter writer;
            std::ofstream file(file_path);
            if (!file.is_open()) {
                std::cerr << "Error: Could not create config file: " << file_path << std::endl;
                return false;
            }

            file << writer.write(config_data);
            std::cout << "Configuration saved to: " << file_path << std::endl;
            return true;
        } catch (const std::exception& e) {
            std::cerr << "Error saving configuration: " << e.what() << std::endl;
            return false;
        }
    }

    // Get configuration for specific environment
    Json::Value get_config(const std::string& env = "") {
        std::lock_guard<std::mutex> lock(config_mutex);
        
        std::string target_env = env.empty() ? environment : env;
        
        // Apply environment-specific overrides
        Json::Value env_config = config_data;
        
        if (target_env == "development") {
            env_config["general"]["debug"] = true;
            env_config["general"]["log_level"] = "DEBUG";
            env_config["database"]["type"] = "sqlite";
            env_config["notifications"]["enabled"] = false;
        } else if (target_env == "testing") {
            env_config["general"]["debug"] = true;
            env_config["general"]["log_level"] = "INFO";
            env_config["analysis"]["ml_enabled"] = false;
            env_config["notifications"]["enabled"] = false;
        } else if (target_env == "production") {
            env_config["general"]["debug"] = false;
            env_config["general"]["log_level"] = "WARNING";
            env_config["security"]["encryption_enabled"] = true;
            env_config["notifications"]["enabled"] = true;
        }
        
        return env_config;
    }

    // Validation methods
    std::vector<std::string> validate_config() {
        std::vector<std::string> errors;
        
        // Check required paths
        std::vector<std::string> required_paths = {
            "rules_dir", "data_dir", "logs_dir"
        };
        
        for (const auto& path_name : required_paths) {
            std::string path = config_data["paths"][path_name].asString();
            if (!fs::exists(path)) {
                errors.push_back("Required path missing: " + path_name);
            }
        }
        
        // Check thresholds
        int warning = config_data["thresholds"]["warning"].asInt();
        int normal = config_data["thresholds"]["normal"].asInt();
        if (warning <= normal) {
            errors.push_back("Warning threshold must be greater than normal threshold");
        }
        
        int critical = config_data["thresholds"]["critical"].asInt();
        if (critical <= warning) {
            errors.push_back("Critical threshold must be greater than warning threshold");
        }
        
        // Check ML model parameters
        double contamination = config_data["ml_model"]["contamination"].asDouble();
        if (contamination <= 0.0 || contamination >= 1.0) {
            errors.push_back("Contamination must be between 0 and 1");
        }
        
        return errors;
    }

    // Setter methods
    void set_value(const std::string& section, const std::string& key, const Json::Value& value) {
        std::lock_guard<std::mutex> lock(config_mutex);
        config_data[section][key] = value;
    }

    void set_environment(const std::string& env) {
        environment = env;
    }

    // Getter methods
    Json::Value get_value(const std::string& section, const std::string& key) const {
        std::lock_guard<std::mutex> lock(config_mutex);
        return config_data[section][key];
    }

    std::string get_path(const std::string& path_name) const {
        return config_data["paths"][path_name].asString();
    }

    bool get_bool(const std::string& section, const std::string& key) const {
        return config_data[section][key].asBool();
    }

    int get_int(const std::string& section, const std::string& key) const {
        return config_data[section][key].asInt();
    }

    double get_double(const std::string& section, const std::string& key) const {
        return config_data[section][key].asDouble();
    }

    std::string get_string(const std::string& section, const std::string& key) const {
        return config_data[section][key].asString();
    }

    // Utility methods
    std::string get_timestamp() {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        
        std::stringstream ss;
        ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
        return ss.str();
    }

    bool validate_ip_address(const std::string& ip) {
        std::regex ip_regex(R"(^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$)");
        return std::regex_match(ip, ip_regex);
    }

    bool validate_email(const std::string& email) {
        std::regex email_regex(R"(^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$)");
        return std::regex_match(email, email_regex);
    }

    bool validate_url(const std::string& url) {
        std::regex url_regex(R"(^https?://(?:[-\w.])+(?:\:[0-9]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$)");
        return std::regex_match(url, url_regex);
    }

    // Environment-specific configurations
    Json::Value get_development_config() {
        return get_config("development");
    }

    Json::Value get_testing_config() {
        return get_config("testing");
    }

    Json::Value get_production_config() {
        return get_config("production");
    }

    // Reload configuration
    bool reload() {
        if (!config_file_path.empty()) {
            return load_from_file(config_file_path);
        }
        return false;
    }

    // Export configuration to different formats
    std::string export_to_json() {
        Json::StyledWriter writer;
        return writer.write(config_data);
    }

    std::string export_to_yaml() {
        // Simple YAML export (would need a proper YAML library)
        std::stringstream ss;
        export_to_yaml_recursive(config_data, ss, 0);
        return ss.str();
    }

private:
    void export_to_yaml_recursive(const Json::Value& value, std::stringstream& ss, int indent) {
        std::string indent_str(indent * 2, ' ');
        
        if (value.isObject()) {
            for (const auto& key : value.getMemberNames()) {
                ss << indent_str << key << ": ";
                if (value[key].isObject() || value[key].isArray()) {
                    ss << std::endl;
                    export_to_yaml_recursive(value[key], ss, indent + 1);
                } else {
                    ss << value[key].asString() << std::endl;
                }
            }
        } else if (value.isArray()) {
            for (const auto& item : value) {
                ss << indent_str << "- ";
                if (item.isObject() || item.isArray()) {
                    ss << std::endl;
                    export_to_yaml_recursive(item, ss, indent + 1);
                } else {
                    ss << item.asString() << std::endl;
                }
            }
        }
    }
};

// Main function for testing
int main() {
    Config config;
    
    // Validate configuration
    auto errors = config.validate_config();
    if (!errors.empty()) {
        std::cout << "Configuration errors found:" << std::endl;
        for (const auto& error : errors) {
            std::cout << "  - " << error << std::endl;
        }
    } else {
        std::cout << "Configuration is valid" << std::endl;
    }
    
    // Test some getters
    std::cout << "Analysis enabled: " << config.get_bool("analysis", "enabled") << std::endl;
    std::cout << "Sensitivity: " << config.get_double("analysis", "sensitivity") << std::endl;
    std::cout << "Rules directory: " << config.get_path("rules_dir") << std::endl;
    
    // Save configuration
    config.save_to_file();
    
    return 0;
} 