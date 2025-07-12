#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <chrono>
#include <thread>
#include <mutex>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <regex>
#include <memory>
#include <filesystem>
#include <json/json.h>
#include <netinet/ip.h>
#include <netinet/tcp.h>
#include <netinet/udp.h>
#include <arpa/inet.h>

namespace fs = std::filesystem;

// Rule structure
struct FirewallRule {
    int id;
    std::string name;
    std::string action; // "ACCEPT", "DROP", "REJECT"
    std::string protocol; // "TCP", "UDP", "ICMP", "ALL"
    std::string source_ip;
    std::string destination_ip;
    uint16_t source_port;
    uint16_t destination_port;
    std::string direction; // "IN", "OUT", "BOTH"
    bool enabled;
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point last_used;
    int hit_count;
    std::string description;
};

// Connection tracking structure
struct Connection {
    std::string source_ip;
    std::string destination_ip;
    uint16_t source_port;
    uint16_t destination_port;
    std::string protocol;
    std::chrono::system_clock::time_point established_at;
    std::chrono::system_clock::time_point last_seen;
    std::string state; // "NEW", "ESTABLISHED", "RELATED", "INVALID"
    int packet_count;
    size_t byte_count;
};

// Packet structure
struct Packet {
    std::chrono::system_clock::time_point timestamp;
    std::string source_ip;
    std::string destination_ip;
    uint16_t source_port;
    uint16_t destination_port;
    std::string protocol;
    size_t size;
    std::string direction;
    bool processed;
    std::string action_taken;
};

// NAT structure
struct NATRule {
    int id;
    std::string name;
    std::string type; // "SNAT", "DNAT", "MASQUERADE"
    std::string source_ip;
    std::string destination_ip;
    std::string translated_ip;
    uint16_t source_port;
    uint16_t destination_port;
    uint16_t translated_port;
    bool enabled;
};

// Firewall class
class Firewall {
private:
    // Configuration
    struct Config {
        bool enabled = true;
        std::string default_policy_in = "DROP";
        std::string default_policy_out = "ACCEPT";
        bool connection_tracking = true;
        bool nat_enabled = true;
        bool logging_enabled = true;
        int max_connections = 10000;
        int connection_timeout = 3600;
        int rule_check_timeout = 1000;
        std::string log_file = "logs/firewall.log";
    } config;

    // State
    std::vector<FirewallRule> rules;
    std::map<std::string, Connection> connections;
    std::vector<NATRule> nat_rules;
    std::vector<Packet> packet_log;
    std::set<std::string> blocked_ips;
    std::set<std::string> whitelist_ips;
    
    // Threading
    std::thread cleanup_thread;
    std::mutex rules_mutex;
    std::mutex connections_mutex;
    std::mutex nat_mutex;
    std::mutex log_mutex;
    bool running = false;
    bool cleanup_running = false;

    // Logging
    std::ofstream log_file;
    int next_rule_id = 1;
    int next_nat_id = 1;

public:
    Firewall() {
        initialize();
    }

    ~Firewall() {
        stop();
        if (log_file.is_open()) {
            log_file.close();
        }
    }

private:
    void initialize() {
        // Create logs directory
        fs::create_directories("logs");
        log_file.open(config.log_file, std::ios::app);
        
        // Load configuration
        load_config();
        
        // Load default rules
        load_default_rules();
        
        // Load NAT rules
        load_nat_rules();
        
        log("Firewall initialized");
    }

    void load_config() {
        try {
            std::ifstream file("config/firewall_config.json");
            if (file.is_open()) {
                Json::Value config_data;
                Json::Reader reader;
                if (reader.parse(file, config_data)) {
                    config.enabled = config_data.get("enabled", true).asBool();
                    config.default_policy_in = config_data.get("default_policy_in", "DROP").asString();
                    config.default_policy_out = config_data.get("default_policy_out", "ACCEPT").asString();
                    config.connection_tracking = config_data.get("connection_tracking", true).asBool();
                    config.nat_enabled = config_data.get("nat_enabled", true).asBool();
                    config.logging_enabled = config_data.get("logging_enabled", true).asBool();
                    config.max_connections = config_data.get("max_connections", 10000).asInt();
                    config.connection_timeout = config_data.get("connection_timeout", 3600).asInt();
                    config.rule_check_timeout = config_data.get("rule_check_timeout", 1000).asInt();
                }
            }
        } catch (const std::exception& e) {
            log("Error loading config: " + std::string(e.what()));
        }
    }

    void load_default_rules() {
        // Allow loopback
        add_rule("Allow Loopback", "ACCEPT", "ALL", "127.0.0.1", "127.0.0.1", 0, 0, "BOTH", "Allow loopback traffic");
        
        // Allow established connections
        add_rule("Allow Established", "ACCEPT", "ALL", "0.0.0.0/0", "0.0.0.0/0", 0, 0, "BOTH", "Allow established connections");
        
        // Allow ICMP
        add_rule("Allow ICMP", "ACCEPT", "ICMP", "0.0.0.0/0", "0.0.0.0/0", 0, 0, "BOTH", "Allow ICMP traffic");
        
        // Allow SSH
        add_rule("Allow SSH", "ACCEPT", "TCP", "0.0.0.0/0", "0.0.0.0/0", 0, 22, "IN", "Allow SSH connections");
        
        // Allow HTTP/HTTPS
        add_rule("Allow HTTP", "ACCEPT", "TCP", "0.0.0.0/0", "0.0.0.0/0", 0, 80, "IN", "Allow HTTP traffic");
        add_rule("Allow HTTPS", "ACCEPT", "TCP", "0.0.0.0/0", "0.0.0.0/0", 0, 443, "IN", "Allow HTTPS traffic");
        
        // Block common attack ports
        add_rule("Block Telnet", "DROP", "TCP", "0.0.0.0/0", "0.0.0.0/0", 0, 23, "IN", "Block Telnet");
        add_rule("Block FTP", "DROP", "TCP", "0.0.0.0/0", "0.0.0.0/0", 0, 21, "IN", "Block FTP");
    }

    void load_nat_rules() {
        // Add default NAT rule for outgoing traffic
        NATRule nat_rule;
        nat_rule.id = next_nat_id++;
        nat_rule.name = "Default SNAT";
        nat_rule.type = "MASQUERADE";
        nat_rule.source_ip = "192.168.0.0/16";
        nat_rule.destination_ip = "0.0.0.0/0";
        nat_rule.enabled = true;
        
        nat_rules.push_back(nat_rule);
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
            log("Firewall is already running");
            return false;
        }

        if (!config.enabled) {
            log("Firewall is disabled in configuration");
            return false;
        }

        running = true;
        cleanup_running = true;

        // Start cleanup thread
        cleanup_thread = std::thread(&Firewall::cleanup_thread_function, this);

        log("Firewall started successfully");
        return true;
    }

    void stop() {
        if (!running) {
            return;
        }

        running = false;
        cleanup_running = false;

        // Wait for cleanup thread
        if (cleanup_thread.joinable()) {
            cleanup_thread.join();
        }

        log("Firewall stopped");
    }

    // Rule management
    int add_rule(const std::string& name, const std::string& action, 
                 const std::string& protocol, const std::string& source_ip,
                 const std::string& destination_ip, uint16_t source_port,
                 uint16_t destination_port, const std::string& direction,
                 const std::string& description = "") {
        std::lock_guard<std::mutex> lock(rules_mutex);
        
        FirewallRule rule;
        rule.id = next_rule_id++;
        rule.name = name;
        rule.action = action;
        rule.protocol = protocol;
        rule.source_ip = source_ip;
        rule.destination_ip = destination_ip;
        rule.source_port = source_port;
        rule.destination_port = destination_port;
        rule.direction = direction;
        rule.enabled = true;
        rule.created_at = std::chrono::system_clock::now();
        rule.hit_count = 0;
        rule.description = description;
        
        rules.push_back(rule);
        
        log("Rule added: " + name + " (ID: " + std::to_string(rule.id) + ")");
        return rule.id;
    }

    bool remove_rule(int rule_id) {
        std::lock_guard<std::mutex> lock(rules_mutex);
        
        auto it = std::find_if(rules.begin(), rules.end(),
            [rule_id](const FirewallRule& rule) {
                return rule.id == rule_id;
            });
        
        if (it != rules.end()) {
            std::string rule_name = it->name;
            rules.erase(it);
            log("Rule removed: " + rule_name + " (ID: " + std::to_string(rule_id) + ")");
            return true;
        }
        
        return false;
    }

    bool enable_rule(int rule_id) {
        std::lock_guard<std::mutex> lock(rules_mutex);
        
        auto it = std::find_if(rules.begin(), rules.end(),
            [rule_id](const FirewallRule& rule) {
                return rule.id == rule_id;
            });
        
        if (it != rules.end()) {
            it->enabled = true;
            log("Rule enabled: " + it->name + " (ID: " + std::to_string(rule_id) + ")");
            return true;
        }
        
        return false;
    }

    bool disable_rule(int rule_id) {
        std::lock_guard<std::mutex> lock(rules_mutex);
        
        auto it = std::find_if(rules.begin(), rules.end(),
            [rule_id](const FirewallRule& rule) {
                return rule.id == rule_id;
            });
        
        if (it != rules.end()) {
            it->enabled = false;
            log("Rule disabled: " + it->name + " (ID: " + std::to_string(rule_id) + ")");
            return true;
        }
        
        return false;
    }

    std::vector<FirewallRule> get_rules() const {
        std::lock_guard<std::mutex> lock(rules_mutex);
        return rules;
    }

    // Packet processing
    std::string process_packet(const Packet& packet) {
        if (!running) {
            return "DROP"; // Default to drop when not running
        }

        // Check if IP is blocked
        if (blocked_ips.find(packet.source_ip) != blocked_ips.end()) {
            log_packet(packet, "DROP", "IP blocked");
            return "DROP";
        }

        // Check if IP is whitelisted
        if (whitelist_ips.find(packet.source_ip) != whitelist_ips.end()) {
            log_packet(packet, "ACCEPT", "IP whitelisted");
            return "ACCEPT";
        }

        // Check connection tracking
        if (config.connection_tracking) {
            std::string conn_action = check_connection_tracking(packet);
            if (!conn_action.empty()) {
                log_packet(packet, conn_action, "Connection tracking");
                return conn_action;
            }
        }

        // Check rules
        std::string rule_action = check_rules(packet);
        if (!rule_action.empty()) {
            log_packet(packet, rule_action, "Rule match");
            return rule_action;
        }

        // Apply default policy
        std::string default_policy = (packet.direction == "IN") ? 
            config.default_policy_in : config.default_policy_out;
        
        log_packet(packet, default_policy, "Default policy");
        return default_policy;
    }

private:
    std::string check_rules(const Packet& packet) {
        std::lock_guard<std::mutex> lock(rules_mutex);
        
        // Check rules in order (first match wins)
        for (auto& rule : rules) {
            if (!rule.enabled) {
                continue;
            }

            if (match_rule(rule, packet)) {
                rule.hit_count++;
                rule.last_used = std::chrono::system_clock::now();
                return rule.action;
            }
        }
        
        return "";
    }

    bool match_rule(const FirewallRule& rule, const Packet& packet) {
        // Check direction
        if (rule.direction != "BOTH" && rule.direction != packet.direction) {
            return false;
        }

        // Check protocol
        if (rule.protocol != "ALL" && rule.protocol != packet.protocol) {
            return false;
        }

        // Check source IP
        if (!match_ip(rule.source_ip, packet.source_ip)) {
            return false;
        }

        // Check destination IP
        if (!match_ip(rule.destination_ip, packet.destination_ip)) {
            return false;
        }

        // Check ports
        if (rule.source_port != 0 && rule.source_port != packet.source_port) {
            return false;
        }

        if (rule.destination_port != 0 && rule.destination_port != packet.destination_port) {
            return false;
        }

        return true;
    }

    bool match_ip(const std::string& rule_ip, const std::string& packet_ip) {
        if (rule_ip == "0.0.0.0/0" || rule_ip == "any") {
            return true;
        }

        // Simple IP matching (could be enhanced with CIDR support)
        if (rule_ip.find('/') != std::string::npos) {
            // CIDR notation - simplified implementation
            std::string network = rule_ip.substr(0, rule_ip.find('/'));
            return network == packet_ip;
        }

        return rule_ip == packet_ip;
    }

    std::string check_connection_tracking(const Packet& packet) {
        std::lock_guard<std::mutex> lock(connections_mutex);
        
        std::string conn_key = packet.source_ip + ":" + std::to_string(packet.source_port) + 
                              "-" + packet.destination_ip + ":" + std::to_string(packet.destination_port) + 
                              "-" + packet.protocol;
        
        auto it = connections.find(conn_key);
        if (it != connections.end()) {
            // Update connection
            it->second.last_seen = std::chrono::system_clock::now();
            it->second.packet_count++;
            it->second.byte_count += packet.size;
            
            if (it->second.state == "ESTABLISHED") {
                return "ACCEPT";
            }
        } else {
            // New connection
            Connection conn;
            conn.source_ip = packet.source_ip;
            conn.destination_ip = packet.destination_ip;
            conn.source_port = packet.source_port;
            conn.destination_port = packet.destination_port;
            conn.protocol = packet.protocol;
            conn.established_at = std::chrono::system_clock::now();
            conn.last_seen = std::chrono::system_clock::now();
            conn.state = "NEW";
            conn.packet_count = 1;
            conn.byte_count = packet.size;
            
            connections[conn_key] = conn;
        }
        
        return "";
    }

    void log_packet(const Packet& packet, const std::string& action, const std::string& reason) {
        if (!config.logging_enabled) {
            return;
        }

        std::lock_guard<std::mutex> lock(log_mutex);
        
        Packet logged_packet = packet;
        logged_packet.processed = true;
        logged_packet.action_taken = action;
        
        packet_log.push_back(logged_packet);
        
        // Limit log size
        if (packet_log.size() > 10000) {
            packet_log.erase(packet_log.begin());
        }
        
        // Log to file
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        std::string timestamp = std::ctime(&time_t);
        timestamp.pop_back();
        
        std::string log_entry = "[" + timestamp + "] " + action + " " + 
                               packet.protocol + " " + packet.source_ip + ":" + 
                               std::to_string(packet.source_port) + " -> " + 
                               packet.destination_ip + ":" + std::to_string(packet.destination_port) + 
                               " (" + reason + ")\n";
        
        if (log_file.is_open()) {
            log_file << log_entry;
            log_file.flush();
        }
    }

    void cleanup_thread_function() {
        while (cleanup_running) {
            std::this_thread::sleep_for(std::chrono::seconds(60));
            
            if (running) {
                cleanup_old_connections();
                cleanup_old_logs();
            }
        }
    }

    void cleanup_old_connections() {
        std::lock_guard<std::mutex> lock(connections_mutex);
        
        auto cutoff_time = std::chrono::system_clock::now() - 
                          std::chrono::seconds(config.connection_timeout);
        
        auto it = connections.begin();
        while (it != connections.end()) {
            if (it->second.last_seen < cutoff_time) {
                it = connections.erase(it);
            } else {
                ++it;
            }
        }
    }

    void cleanup_old_logs() {
        std::lock_guard<std::mutex> lock(log_mutex);
        
        auto cutoff_time = std::chrono::system_clock::now() - 
                          std::chrono::hours(24); // Keep 24 hours of logs
        
        packet_log.erase(
            std::remove_if(packet_log.begin(), packet_log.end(),
                [cutoff_time](const Packet& packet) {
                    return packet.timestamp < cutoff_time;
                }),
            packet_log.end()
        );
    }

public:
    // IP management
    void block_ip(const std::string& ip) {
        blocked_ips.insert(ip);
        log("IP blocked: " + ip);
    }

    void unblock_ip(const std::string& ip) {
        blocked_ips.erase(ip);
        log("IP unblocked: " + ip);
    }

    void whitelist_ip(const std::string& ip) {
        whitelist_ips.insert(ip);
        blocked_ips.erase(ip); // Remove from blocked if present
        log("IP whitelisted: " + ip);
    }

    void remove_whitelist_ip(const std::string& ip) {
        whitelist_ips.erase(ip);
        log("IP removed from whitelist: " + ip);
    }

    std::set<std::string> get_blocked_ips() const {
        return blocked_ips;
    }

    std::set<std::string> get_whitelist_ips() const {
        return whitelist_ips;
    }

    // NAT management
    int add_nat_rule(const std::string& name, const std::string& type,
                     const std::string& source_ip, const std::string& destination_ip,
                     const std::string& translated_ip, uint16_t source_port = 0,
                     uint16_t destination_port = 0, uint16_t translated_port = 0) {
        std::lock_guard<std::mutex> lock(nat_mutex);
        
        NATRule rule;
        rule.id = next_nat_id++;
        rule.name = name;
        rule.type = type;
        rule.source_ip = source_ip;
        rule.destination_ip = destination_ip;
        rule.translated_ip = translated_ip;
        rule.source_port = source_port;
        rule.destination_port = destination_port;
        rule.translated_port = translated_port;
        rule.enabled = true;
        
        nat_rules.push_back(rule);
        
        log("NAT rule added: " + name + " (ID: " + std::to_string(rule.id) + ")");
        return rule.id;
    }

    bool remove_nat_rule(int rule_id) {
        std::lock_guard<std::mutex> lock(nat_mutex);
        
        auto it = std::find_if(nat_rules.begin(), nat_rules.end(),
            [rule_id](const NATRule& rule) {
                return rule.id == rule_id;
            });
        
        if (it != nat_rules.end()) {
            std::string rule_name = it->name;
            nat_rules.erase(it);
            log("NAT rule removed: " + rule_name + " (ID: " + std::to_string(rule_id) + ")");
            return true;
        }
        
        return false;
    }

    std::vector<NATRule> get_nat_rules() const {
        std::lock_guard<std::mutex> lock(nat_mutex);
        return nat_rules;
    }

    // Statistics and monitoring
    std::map<std::string, Connection> get_connections() const {
        std::lock_guard<std::mutex> lock(connections_mutex);
        return connections;
    }

    std::vector<Packet> get_packet_log() const {
        std::lock_guard<std::mutex> lock(log_mutex);
        return packet_log;
    }

    bool is_running() const {
        return running;
    }

    // Configuration methods
    void set_default_policy_in(const std::string& policy) {
        config.default_policy_in = policy;
        log("Default inbound policy set to: " + policy);
    }

    void set_default_policy_out(const std::string& policy) {
        config.default_policy_out = policy;
        log("Default outbound policy set to: " + policy);
    }

    void set_connection_tracking(bool enabled) {
        config.connection_tracking = enabled;
        log("Connection tracking " + std::string(enabled ? "enabled" : "disabled"));
    }

    void set_logging_enabled(bool enabled) {
        config.logging_enabled = enabled;
        log("Logging " + std::string(enabled ? "enabled" : "disabled"));
    }

    // Utility methods
    void clear_logs() {
        std::lock_guard<std::mutex> lock(log_mutex);
        packet_log.clear();
        log("Packet logs cleared");
    }

    void clear_connections() {
        std::lock_guard<std::mutex> lock(connections_mutex);
        connections.clear();
        log("Connections cleared");
    }

    void save_rules(const std::string& filename) {
        try {
            Json::Value rules_data;
            rules_data["rules"] = Json::Value(Json::arrayValue);
            
            std::lock_guard<std::mutex> lock(rules_mutex);
            for (const auto& rule : rules) {
                Json::Value rule_data;
                rule_data["id"] = rule.id;
                rule_data["name"] = rule.name;
                rule_data["action"] = rule.action;
                rule_data["protocol"] = rule.protocol;
                rule_data["source_ip"] = rule.source_ip;
                rule_data["destination_ip"] = rule.destination_ip;
                rule_data["source_port"] = rule.source_port;
                rule_data["destination_port"] = rule.destination_port;
                rule_data["direction"] = rule.direction;
                rule_data["enabled"] = rule.enabled;
                rule_data["hit_count"] = rule.hit_count;
                rule_data["description"] = rule.description;
                
                rules_data["rules"].append(rule_data);
            }
            
            Json::StyledWriter writer;
            std::ofstream file(filename);
            if (file.is_open()) {
                file << writer.write(rules_data);
                log("Rules saved to: " + filename);
            }
        } catch (const std::exception& e) {
            log("Error saving rules: " + std::string(e.what()));
        }
    }

    bool load_rules(const std::string& filename) {
        try {
            std::ifstream file(filename);
            if (!file.is_open()) {
                return false;
            }

            Json::Value rules_data;
            Json::Reader reader;
            if (!reader.parse(file, rules_data)) {
                return false;
            }

            std::lock_guard<std::mutex> lock(rules_mutex);
            rules.clear();
            
            for (const auto& rule_data : rules_data["rules"]) {
                FirewallRule rule;
                rule.id = rule_data["id"].asInt();
                rule.name = rule_data["name"].asString();
                rule.action = rule_data["action"].asString();
                rule.protocol = rule_data["protocol"].asString();
                rule.source_ip = rule_data["source_ip"].asString();
                rule.destination_ip = rule_data["destination_ip"].asString();
                rule.source_port = rule_data["source_port"].asUInt();
                rule.destination_port = rule_data["destination_port"].asUInt();
                rule.direction = rule_data["direction"].asString();
                rule.enabled = rule_data["enabled"].asBool();
                rule.hit_count = rule_data["hit_count"].asInt();
                rule.description = rule_data["description"].asString();
                rule.created_at = std::chrono::system_clock::now();
                
                rules.push_back(rule);
                
                if (rule.id >= next_rule_id) {
                    next_rule_id = rule.id + 1;
                }
            }
            
            log("Rules loaded from: " + filename);
            return true;
        } catch (const std::exception& e) {
            log("Error loading rules: " + std::string(e.what()));
            return false;
        }
    }
};

// Main function for testing
int main() {
    Firewall firewall;
    
    if (firewall.start()) {
        std::cout << "Firewall started. Press Enter to stop..." << std::endl;
        std::cin.get();
        
        firewall.stop();
    } else {
        std::cout << "Failed to start firewall" << std::endl;
        return 1;
    }
    
    return 0;
} 