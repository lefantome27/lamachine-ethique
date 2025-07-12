#include <iostream>
#include <vector>
#include <map>
#include <chrono>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <cmath>
#include <random>
#include <memory>
#include <functional>
#include <filesystem>
#include <json/json.h>
#include <pcap.h>
#include <netinet/ip.h>
#include <netinet/tcp.h>
#include <netinet/udp.h>
#include <arpa/inet.h>

namespace fs = std::filesystem;

// Packet structure
struct Packet {
    std::chrono::system_clock::time_point timestamp;
    std::string source_ip;
    std::string destination_ip;
    uint16_t source_port;
    uint16_t destination_port;
    uint8_t protocol;
    size_t size;
    std::vector<uint8_t> payload;
};

// Attack detection structure
struct AttackDetection {
    std::string attack_type;
    std::string source_ip;
    std::chrono::system_clock::time_point timestamp;
    double confidence;
    std::map<std::string, double> metrics;
    std::vector<std::string> evidence;
};

// Statistics structure
struct Statistics {
    std::map<std::string, int> packet_counts;
    std::map<std::string, size_t> byte_counts;
    std::map<std::string, std::vector<double>> packet_rates;
    std::chrono::system_clock::time_point last_update;
    int total_packets = 0;
    size_t total_bytes = 0;
};

// DDoS Monitor class
class DDoSMonitor {
private:
    // Configuration
    struct Config {
        bool enabled = true;
        int capture_timeout = 1000;
        int analysis_interval = 60;
        int alert_threshold = 100;
        int critical_threshold = 500;
        double sensitivity = 0.1;
        int time_window = 300;
        bool auto_block = true;
        int block_duration = 3600;
    } config;

    // State
    std::vector<Packet> packet_buffer;
    std::vector<AttackDetection> detected_attacks;
    Statistics statistics;
    std::map<std::string, std::chrono::system_clock::time_point> blocked_ips;
    
    // Threading
    std::thread capture_thread;
    std::thread analysis_thread;
    std::mutex buffer_mutex;
    std::mutex attacks_mutex;
    std::mutex stats_mutex;
    std::condition_variable buffer_cv;
    bool running = false;
    bool capture_running = false;
    bool analysis_running = false;

    // Logging
    std::ofstream log_file;
    std::string log_path;

    // PCAP
    pcap_t* pcap_handle = nullptr;
    std::string interface_name = "eth0";

public:
    DDoSMonitor() {
        initialize();
    }

    ~DDoSMonitor() {
        stop();
        if (pcap_handle) {
            pcap_close(pcap_handle);
        }
        if (log_file.is_open()) {
            log_file.close();
        }
    }

private:
    void initialize() {
        // Create logs directory
        fs::create_directories("logs");
        log_path = "logs/ddos_monitor.log";
        log_file.open(log_path, std::ios::app);
        
        log("DDoS Monitor initialized");
        
        // Load configuration
        load_config();
    }

    void load_config() {
        try {
            std::ifstream file("config/ddos_config.json");
            if (file.is_open()) {
                Json::Value config_data;
                Json::Reader reader;
                if (reader.parse(file, config_data)) {
                    config.enabled = config_data.get("enabled", true).asBool();
                    config.capture_timeout = config_data.get("capture_timeout", 1000).asInt();
                    config.analysis_interval = config_data.get("analysis_interval", 60).asInt();
                    config.alert_threshold = config_data.get("alert_threshold", 100).asInt();
                    config.critical_threshold = config_data.get("critical_threshold", 500).asInt();
                    config.sensitivity = config_data.get("sensitivity", 0.1).asDouble();
                    config.time_window = config_data.get("time_window", 300).asInt();
                    config.auto_block = config_data.get("auto_block", true).asBool();
                    config.block_duration = config_data.get("block_duration", 3600).asInt();
                }
            }
        } catch (const std::exception& e) {
            log("Error loading config: " + std::string(e.what()));
        }
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

public:
    bool start() {
        if (running) {
            log("DDoS Monitor is already running");
            return false;
        }

        if (!config.enabled) {
            log("DDoS Monitor is disabled in configuration");
            return false;
        }

        running = true;
        capture_running = true;
        analysis_running = true;

        // Initialize PCAP
        if (!initialize_pcap()) {
            log("Failed to initialize PCAP");
            running = false;
            return false;
        }

        // Start threads
        capture_thread = std::thread(&DDoSMonitor::capture_thread_function, this);
        analysis_thread = std::thread(&DDoSMonitor::analysis_thread_function, this);

        log("DDoS Monitor started successfully");
        return true;
    }

    void stop() {
        if (!running) {
            return;
        }

        running = false;
        capture_running = false;
        analysis_running = false;

        // Stop PCAP
        if (pcap_handle) {
            pcap_breakloop(pcap_handle);
        }

        // Wait for threads
        if (capture_thread.joinable()) {
            capture_thread.join();
        }
        if (analysis_thread.joinable()) {
            analysis_thread.join();
        }

        log("DDoS Monitor stopped");
    }

private:
    bool initialize_pcap() {
        char errbuf[PCAP_ERRBUF_SIZE];
        
        // Find default interface if not specified
        if (interface_name.empty()) {
            char* dev = pcap_lookupdev(errbuf);
            if (dev == nullptr) {
                log("Error finding default device: " + std::string(errbuf));
                return false;
            }
            interface_name = dev;
        }

        // Open device
        pcap_handle = pcap_open_live(interface_name.c_str(), 65536, 1, config.capture_timeout, errbuf);
        if (pcap_handle == nullptr) {
            log("Error opening device " + interface_name + ": " + std::string(errbuf));
            return false;
        }

        // Set filter (capture all packets for now)
        struct bpf_program fp;
        if (pcap_compile(pcap_handle, &fp, "", 0, PCAP_NETMASK_UNKNOWN) == -1) {
            log("Error compiling filter");
            return false;
        }

        if (pcap_setfilter(pcap_handle, &fp) == -1) {
            log("Error setting filter");
            return false;
        }

        log("PCAP initialized on interface: " + interface_name);
        return true;
    }

    void capture_thread_function() {
        log("Packet capture thread started");
        
        while (capture_running) {
            struct pcap_pkthdr header;
            const u_char* packet_data = pcap_next(pcap_handle, &header);
            
            if (packet_data != nullptr) {
                process_packet(packet_data, &header);
            }
        }
        
        log("Packet capture thread stopped");
    }

    void process_packet(const u_char* packet_data, const struct pcap_pkthdr* header) {
        Packet packet;
        packet.timestamp = std::chrono::system_clock::now();
        packet.size = header->len;

        // Parse Ethernet header (skip first 14 bytes)
        const u_char* ip_data = packet_data + 14;
        
        // Parse IP header
        struct ip* ip_header = (struct ip*)ip_data;
        packet.source_ip = inet_ntoa(ip_header->ip_src);
        packet.destination_ip = inet_ntoa(ip_header->ip_dst);
        packet.protocol = ip_header->ip_p;

        // Parse TCP/UDP header
        if (packet.protocol == IPPROTO_TCP) {
            struct tcphdr* tcp_header = (struct tcphdr*)(ip_data + (ip_header->ip_hl * 4));
            packet.source_port = ntohs(tcp_header->source);
            packet.destination_port = ntohs(tcp_header->dest);
        } else if (packet.protocol == IPPROTO_UDP) {
            struct udphdr* udp_header = (struct udphdr*)(ip_data + (ip_header->ip_hl * 4));
            packet.source_port = ntohs(udp_header->source);
            packet.destination_port = ntohs(udp_header->dest);
        }

        // Add to buffer
        {
            std::lock_guard<std::mutex> lock(buffer_mutex);
            packet_buffer.push_back(packet);
            
            // Limit buffer size
            if (packet_buffer.size() > 10000) {
                packet_buffer.erase(packet_buffer.begin());
            }
        }

        // Update statistics
        update_statistics(packet);
    }

    void update_statistics(const Packet& packet) {
        std::lock_guard<std::mutex> lock(stats_mutex);
        
        statistics.total_packets++;
        statistics.total_bytes += packet.size;
        
        // Update per-IP statistics
        statistics.packet_counts[packet.source_ip]++;
        statistics.byte_counts[packet.source_ip] += packet.size;
        
        // Update packet rates
        auto now = std::chrono::system_clock::now();
        if (statistics.packet_rates.find(packet.source_ip) == statistics.packet_rates.end()) {
            statistics.packet_rates[packet.source_ip] = std::vector<double>();
        }
        
        statistics.packet_rates[packet.source_ip].push_back(1.0);
        
        // Keep only recent rates
        if (statistics.packet_rates[packet.source_ip].size() > 100) {
            statistics.packet_rates[packet.source_ip].erase(
                statistics.packet_rates[packet.source_ip].begin()
            );
        }
        
        statistics.last_update = now;
    }

    void analysis_thread_function() {
        log("Analysis thread started");
        
        while (analysis_running) {
            std::this_thread::sleep_for(std::chrono::seconds(config.analysis_interval));
            
            if (running) {
                analyze_traffic();
                cleanup_old_data();
            }
        }
        
        log("Analysis thread stopped");
    }

    void analyze_traffic() {
        std::vector<Packet> current_buffer;
        
        {
            std::lock_guard<std::mutex> lock(buffer_mutex);
            current_buffer = packet_buffer;
        }

        if (current_buffer.empty()) {
            return;
        }

        // Analyze each source IP
        std::map<std::string, std::vector<Packet>> ip_packets;
        for (const auto& packet : current_buffer) {
            ip_packets[packet.source_ip].push_back(packet);
        }

        for (const auto& [ip, packets] : ip_packets) {
            analyze_ip_traffic(ip, packets);
        }
    }

    void analyze_ip_traffic(const std::string& ip, const std::vector<Packet>& packets) {
        // Check if IP is already blocked
        if (is_ip_blocked(ip)) {
            return;
        }

        // Calculate metrics
        int packet_count = packets.size();
        size_t total_bytes = 0;
        double avg_packet_size = 0.0;
        double packet_rate = 0.0;
        
        for (const auto& packet : packets) {
            total_bytes += packet.size;
        }
        
        if (!packets.empty()) {
            avg_packet_size = static_cast<double>(total_bytes) / packets.size();
            packet_rate = static_cast<double>(packet_count) / config.analysis_interval;
        }

        // Detect attacks
        std::vector<AttackDetection> attacks;

        // DDoS detection
        if (packet_rate > config.critical_threshold) {
            AttackDetection attack;
            attack.attack_type = "DDoS";
            attack.source_ip = ip;
            attack.timestamp = std::chrono::system_clock::now();
            attack.confidence = std::min(1.0, packet_rate / config.critical_threshold);
            attack.metrics["packet_rate"] = packet_rate;
            attack.metrics["packet_count"] = packet_count;
            attack.metrics["total_bytes"] = total_bytes;
            attack.evidence.push_back("High packet rate: " + std::to_string(packet_rate));
            attacks.push_back(attack);
        }

        // SYN flood detection
        int syn_count = 0;
        for (const auto& packet : packets) {
            if (packet.protocol == IPPROTO_TCP && packet.destination_port == 80) {
                syn_count++;
            }
        }
        
        if (syn_count > config.alert_threshold) {
            AttackDetection attack;
            attack.attack_type = "SYN Flood";
            attack.source_ip = ip;
            attack.timestamp = std::chrono::system_clock::now();
            attack.confidence = std::min(1.0, static_cast<double>(syn_count) / config.alert_threshold);
            attack.metrics["syn_count"] = syn_count;
            attack.metrics["packet_count"] = packet_count;
            attack.evidence.push_back("High SYN count: " + std::to_string(syn_count));
            attacks.push_back(attack);
        }

        // UDP flood detection
        int udp_count = 0;
        for (const auto& packet : packets) {
            if (packet.protocol == IPPROTO_UDP) {
                udp_count++;
            }
        }
        
        if (udp_count > config.alert_threshold) {
            AttackDetection attack;
            attack.attack_type = "UDP Flood";
            attack.source_ip = ip;
            attack.timestamp = std::chrono::system_clock::now();
            attack.confidence = std::min(1.0, static_cast<double>(udp_count) / config.alert_threshold);
            attack.metrics["udp_count"] = udp_count;
            attack.metrics["packet_count"] = packet_count;
            attack.evidence.push_back("High UDP count: " + std::to_string(udp_count));
            attacks.push_back(attack);
        }

        // Process detected attacks
        for (const auto& attack : attacks) {
            handle_attack(attack);
        }
    }

    void handle_attack(const AttackDetection& attack) {
        std::lock_guard<std::mutex> lock(attacks_mutex);
        
        // Add to detected attacks
        detected_attacks.push_back(attack);
        
        // Log attack
        std::string attack_msg = "Attack detected: " + attack.attack_type + 
                                " from " + attack.source_ip + 
                                " (confidence: " + std::to_string(attack.confidence) + ")";
        log(attack_msg);
        
        // Auto-block if enabled
        if (config.auto_block && attack.confidence > 0.7) {
            block_ip(attack.source_ip);
        }
        
        // Send alert
        send_alert(attack);
    }

    void block_ip(const std::string& ip) {
        auto now = std::chrono::system_clock::now();
        blocked_ips[ip] = now;
        
        log("IP blocked: " + ip);
        
        // Here you would implement actual IP blocking
        // For example, using iptables on Linux
        // system(("iptables -A INPUT -s " + ip + " -j DROP").c_str());
    }

    bool is_ip_blocked(const std::string& ip) {
        auto it = blocked_ips.find(ip);
        if (it == blocked_ips.end()) {
            return false;
        }
        
        auto now = std::chrono::system_clock::now();
        auto block_time = it->second;
        
        // Check if block has expired
        if (now - block_time > std::chrono::seconds(config.block_duration)) {
            blocked_ips.erase(it);
            return false;
        }
        
        return true;
    }

    void send_alert(const AttackDetection& attack) {
        // Create alert message
        Json::Value alert;
        alert["type"] = "ddos_attack";
        alert["attack_type"] = attack.attack_type;
        alert["source_ip"] = attack.source_ip;
        alert["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
            attack.timestamp.time_since_epoch()).count();
        alert["confidence"] = attack.confidence;
        alert["metrics"] = Json::Value(Json::objectValue);
        
        for (const auto& [key, value] : attack.metrics) {
            alert["metrics"][key] = value;
        }
        
        alert["evidence"] = Json::Value(Json::arrayValue);
        for (const auto& evidence : attack.evidence) {
            alert["evidence"].append(evidence);
        }
        
        // Save alert to file
        std::string alert_file = "logs/alert_" + std::to_string(
            std::chrono::duration_cast<std::chrono::seconds>(
                attack.timestamp.time_since_epoch()).count()) + ".json";
        
        Json::StyledWriter writer;
        std::ofstream file(alert_file);
        if (file.is_open()) {
            file << writer.write(alert);
        }
        
        log("Alert saved: " + alert_file);
    }

    void cleanup_old_data() {
        auto cutoff_time = std::chrono::system_clock::now() - 
                          std::chrono::seconds(config.time_window);
        
        // Clean packet buffer
        {
            std::lock_guard<std::mutex> lock(buffer_mutex);
            packet_buffer.erase(
                std::remove_if(packet_buffer.begin(), packet_buffer.end(),
                    [cutoff_time](const Packet& packet) {
                        return packet.timestamp < cutoff_time;
                    }),
                packet_buffer.end()
            );
        }
        
        // Clean detected attacks
        {
            std::lock_guard<std::mutex> lock(attacks_mutex);
            detected_attacks.erase(
                std::remove_if(detected_attacks.begin(), detected_attacks.end(),
                    [cutoff_time](const AttackDetection& attack) {
                        return attack.timestamp < cutoff_time;
                    }),
                detected_attacks.end()
            );
        }
        
        // Clean blocked IPs
        auto it = blocked_ips.begin();
        while (it != blocked_ips.end()) {
            if (std::chrono::system_clock::now() - it->second > 
                std::chrono::seconds(config.block_duration)) {
                it = blocked_ips.erase(it);
            } else {
                ++it;
            }
        }
    }

public:
    // Getter methods
    std::vector<AttackDetection> get_detected_attacks() const {
        std::lock_guard<std::mutex> lock(attacks_mutex);
        return detected_attacks;
    }

    Statistics get_statistics() const {
        std::lock_guard<std::mutex> lock(stats_mutex);
        return statistics;
    }

    std::map<std::string, std::chrono::system_clock::time_point> get_blocked_ips() const {
        return blocked_ips;
    }

    bool is_running() const {
        return running;
    }

    // Configuration methods
    void set_sensitivity(double sensitivity) {
        config.sensitivity = sensitivity;
    }

    void set_alert_threshold(int threshold) {
        config.alert_threshold = threshold;
    }

    void set_critical_threshold(int threshold) {
        config.critical_threshold = threshold;
    }

    void set_auto_block(bool enabled) {
        config.auto_block = enabled;
    }

    // Utility methods
    void unblock_ip(const std::string& ip) {
        blocked_ips.erase(ip);
        log("IP unblocked: " + ip);
    }

    void clear_statistics() {
        std::lock_guard<std::mutex> lock(stats_mutex);
        statistics = Statistics{};
        log("Statistics cleared");
    }
};

// Main function for testing
int main() {
    DDoSMonitor monitor;
    
    if (monitor.start()) {
        std::cout << "DDoS Monitor started. Press Enter to stop..." << std::endl;
        std::cin.get();
        
        monitor.stop();
    } else {
        std::cout << "Failed to start DDoS Monitor" << std::endl;
        return 1;
    }
    
    return 0;
} 