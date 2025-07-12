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
#include <memory>
#include <functional>
#include <filesystem>
#include <json/json.h>
#include <signal.h>
#include <sys/wait.h>
#include <unistd.h>

namespace fs = std::filesystem;

// Component status
enum class ComponentStatus {
    STOPPED,
    STARTING,
    RUNNING,
    STOPPING,
    ERROR,
    CRASHED
};

// Component information
struct Component {
    std::string name;
    std::string executable;
    std::vector<std::string> arguments;
    std::string config_file;
    ComponentStatus status = ComponentStatus::STOPPED;
    pid_t pid = -1;
    std::chrono::system_clock::time_point start_time;
    std::chrono::system_clock::time_point last_heartbeat;
    int restart_count = 0;
    int max_restarts = 3;
    bool auto_restart = true;
    std::string log_file;
    std::ofstream log_stream;
};

// System status
struct SystemStatus {
    bool running = false;
    std::chrono::system_clock::time_point start_time;
    std::map<std::string, ComponentStatus> component_status;
    int total_components = 0;
    int running_components = 0;
    int error_components = 0;
    std::vector<std::string> errors;
    std::vector<std::string> warnings;
};

// Main orchestrator class
class TrafficSecurityOrchestrator {
private:
    // Configuration
    struct Config {
        bool debug = false;
        std::string log_level = "INFO";
        int max_log_size = 10485760; // 10 MB
        int backup_count = 5;
        std::string timezone = "Europe/Paris";
        int heartbeat_interval = 30;
        int restart_delay = 5;
        int max_restarts = 3;
        bool auto_restart = true;
        std::string pid_file = "/var/run/traffic-security.pid";
        std::string log_file = "logs/orchestrator.log";
    } config;

    // State
    std::map<std::string, Component> components;
    SystemStatus system_status;
    std::vector<std::thread> worker_threads;
    std::mutex components_mutex;
    std::mutex status_mutex;
    std::condition_variable shutdown_cv;
    bool shutdown_requested = false;
    bool running = false;

    // Logging
    std::ofstream log_file;
    std::string log_path;

public:
    TrafficSecurityOrchestrator() {
        initialize();
    }

    ~TrafficSecurityOrchestrator() {
        stop();
        if (log_file.is_open()) {
            log_file.close();
        }
    }

private:
    void initialize() {
        // Create logs directory
        fs::create_directories("logs");
        log_path = config.log_file;
        log_file.open(log_path, std::ios::app);
        
        // Load configuration
        load_config();
        
        // Initialize components
        initialize_components();
        
        // Set up signal handlers
        setup_signal_handlers();
        
        log("Traffic Security Orchestrator initialized");
    }

    void load_config() {
        try {
            std::ifstream file("config/main_config.json");
            if (file.is_open()) {
                Json::Value config_data;
                Json::Reader reader;
                if (reader.parse(file, config_data)) {
                    config.debug = config_data["general"]["debug"].asBool();
                    config.log_level = config_data["general"]["log_level"].asString();
                    config.max_log_size = config_data["general"]["max_log_size"].asInt();
                    config.backup_count = config_data["general"]["backup_count"].asInt();
                    config.timezone = config_data["general"]["timezone"].asString();
                    config.heartbeat_interval = config_data.get("heartbeat_interval", 30).asInt();
                    config.restart_delay = config_data.get("restart_delay", 5).asInt();
                    config.max_restarts = config_data.get("max_restarts", 3).asInt();
                    config.auto_restart = config_data.get("auto_restart", true).asBool();
                }
            }
        } catch (const std::exception& e) {
            log("Error loading config: " + std::string(e.what()));
        }
    }

    void initialize_components() {
        // Analysis component
        Component analysis;
        analysis.name = "traffic_analyzer";
        analysis.executable = "bin/traffic_analyzer";
        analysis.config_file = "config/analysis_config.json";
        analysis.log_file = "logs/analysis.log";
        analysis.auto_restart = true;
        analysis.max_restarts = config.max_restarts;
        components["analysis"] = analysis;

        // DDoS Monitor component
        Component ddos_monitor;
        ddos_monitor.name = "ddos_monitor";
        ddos_monitor.executable = "bin/ddos_monitor";
        ddos_monitor.config_file = "config/ddos_config.json";
        ddos_monitor.log_file = "logs/ddos_monitor.log";
        ddos_monitor.auto_restart = true;
        ddos_monitor.max_restarts = config.max_restarts;
        components["ddos_monitor"] = ddos_monitor;

        // Firewall component
        Component firewall;
        firewall.name = "firewall";
        firewall.executable = "bin/firewall";
        firewall.config_file = "config/firewall_config.json";
        firewall.log_file = "logs/firewall.log";
        firewall.auto_restart = true;
        firewall.max_restarts = config.max_restarts;
        components["firewall"] = firewall;

        // GUI component (optional)
        Component gui;
        gui.name = "traffic_gui";
        gui.executable = "bin/traffic_gui";
        gui.config_file = "config/gui_config.json";
        gui.log_file = "logs/gui.log";
        gui.auto_restart = false; // GUI doesn't auto-restart
        gui.max_restarts = 1;
        components["gui"] = gui;

        system_status.total_components = components.size();
    }

    void setup_signal_handlers() {
        signal(SIGINT, signal_handler);
        signal(SIGTERM, signal_handler);
        signal(SIGUSR1, signal_handler);
        signal(SIGUSR2, signal_handler);
    }

    static void signal_handler(int signal) {
        // This is a simple signal handler - in a real implementation,
        // you'd want to use sigaction and have a more sophisticated handler
        switch (signal) {
        case SIGINT:
        case SIGTERM:
            // Graceful shutdown
            break;
        case SIGUSR1:
            // Reload configuration
            break;
        case SIGUSR2:
            // Status report
            break;
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
        
        if (config.debug) {
            std::cout << log_message;
        }
    }

public:
    bool start() {
        if (running) {
            log("Orchestrator is already running");
            return false;
        }

        running = true;
        system_status.running = true;
        system_status.start_time = std::chrono::system_clock::now();

        // Create PID file
        create_pid_file();

        log("Starting Traffic Security System");

        // Start components
        for (auto& [name, component] : components) {
            if (!start_component(name)) {
                log("Failed to start component: " + name);
                system_status.errors.push_back("Failed to start component: " + name);
            }
        }

        // Start worker threads
        start_worker_threads();

        log("Traffic Security System started successfully");
        return true;
    }

    void stop() {
        if (!running) {
            return;
        }

        log("Stopping Traffic Security System");

        running = false;
        system_status.running = false;

        // Stop components
        for (auto& [name, component] : components) {
            stop_component(name);
        }

        // Wait for worker threads
        for (auto& thread : worker_threads) {
            if (thread.joinable()) {
                thread.join();
            }
        }

        // Remove PID file
        remove_pid_file();

        log("Traffic Security System stopped");
    }

private:
    bool start_component(const std::string& name) {
        std::lock_guard<std::mutex> lock(components_mutex);
        
        auto& component = components[name];
        if (component.status == ComponentStatus::RUNNING) {
            return true;
        }

        component.status = ComponentStatus::STARTING;
        update_system_status();

        // Prepare command
        std::string command = component.executable;
        if (!component.config_file.empty()) {
            command += " --config " + component.config_file;
        }
        for (const auto& arg : component.arguments) {
            command += " " + arg;
        }

        // Open log file
        component.log_stream.open(component.log_file, std::ios::app);
        if (!component.log_stream.is_open()) {
            log("Warning: Could not open log file for " + name + ": " + component.log_file);
        }

        // Fork and exec
        pid_t pid = fork();
        if (pid == 0) {
            // Child process
            if (!component.log_file.empty()) {
                int log_fd = open(component.log_file.c_str(), O_WRONLY | O_APPEND | O_CREAT, 0644);
                if (log_fd != -1) {
                    dup2(log_fd, STDOUT_FILENO);
                    dup2(log_fd, STDERR_FILENO);
                    close(log_fd);
                }
            }

            // Execute component
            execl(component.executable.c_str(), component.name.c_str(), nullptr);
            exit(1);
        } else if (pid > 0) {
            // Parent process
            component.pid = pid;
            component.start_time = std::chrono::system_clock::now();
            component.last_heartbeat = std::chrono::system_clock::now();
            component.status = ComponentStatus::RUNNING;
            component.restart_count = 0;

            log("Started component: " + name + " (PID: " + std::to_string(pid) + ")");
            update_system_status();
            return true;
        } else {
            // Fork failed
            component.status = ComponentStatus::ERROR;
            log("Failed to start component: " + name);
            update_system_status();
            return false;
        }
    }

    void stop_component(const std::string& name) {
        std::lock_guard<std::mutex> lock(components_mutex);
        
        auto& component = components[name];
        if (component.status == ComponentStatus::STOPPED) {
            return;
        }

        component.status = ComponentStatus::STOPPING;
        update_system_status();

        if (component.pid > 0) {
            // Send SIGTERM
            kill(component.pid, SIGTERM);
            
            // Wait for graceful shutdown
            int status;
            pid_t result = waitpid(component.pid, &status, WNOHANG);
            
            if (result == 0) {
                // Process didn't exit, send SIGKILL
                std::this_thread::sleep_for(std::chrono::seconds(5));
                kill(component.pid, SIGKILL);
                waitpid(component.pid, &status, 0);
            }
        }

        component.pid = -1;
        component.status = ComponentStatus::STOPPED;
        
        if (component.log_stream.is_open()) {
            component.log_stream.close();
        }

        log("Stopped component: " + name);
        update_system_status();
    }

    void start_worker_threads() {
        // Heartbeat thread
        worker_threads.emplace_back(&TrafficSecurityOrchestrator::heartbeat_thread, this);
        
        // Process monitoring thread
        worker_threads.emplace_back(&TrafficSecurityOrchestrator::monitor_thread, this);
        
        // Status reporting thread
        worker_threads.emplace_back(&TrafficSecurityOrchestrator::status_thread, this);
    }

    void heartbeat_thread() {
        while (running) {
            std::this_thread::sleep_for(std::chrono::seconds(config.heartbeat_interval));
            
            if (!running) break;

            std::lock_guard<std::mutex> lock(components_mutex);
            for (auto& [name, component] : components) {
                if (component.status == ComponentStatus::RUNNING && component.pid > 0) {
                    // Check if process is still alive
                    if (kill(component.pid, 0) == 0) {
                        component.last_heartbeat = std::chrono::system_clock::now();
                    } else {
                        // Process died
                        component.status = ComponentStatus::CRASHED;
                        log("Component crashed: " + name);
                        
                        if (component.auto_restart && component.restart_count < component.max_restarts) {
                            log("Restarting component: " + name);
                            component.restart_count++;
                            std::thread([this, name]() {
                                std::this_thread::sleep_for(std::chrono::seconds(config.restart_delay));
                                start_component(name);
                            }).detach();
                        }
                    }
                }
            }
            
            update_system_status();
        }
    }

    void monitor_thread() {
        while (running) {
            std::this_thread::sleep_for(std::chrono::seconds(10));
            
            if (!running) break;

            // Check for zombie processes
            int status;
            pid_t pid;
            while ((pid = waitpid(-1, &status, WNOHANG)) > 0) {
                // Find which component this PID belongs to
                std::lock_guard<std::mutex> lock(components_mutex);
                for (auto& [name, component] : components) {
                    if (component.pid == pid) {
                        if (WIFEXITED(status)) {
                            log("Component exited normally: " + name + " (exit code: " + 
                                std::to_string(WEXITSTATUS(status)) + ")");
                        } else if (WIFSIGNALED(status)) {
                            log("Component killed by signal: " + name + " (signal: " + 
                                std::to_string(WTERMSIG(status)) + ")");
                        }
                        
                        component.status = ComponentStatus::STOPPED;
                        component.pid = -1;
                        break;
                    }
                }
            }
        }
    }

    void status_thread() {
        while (running) {
            std::this_thread::sleep_for(std::chrono::seconds(60));
            
            if (!running) break;

            // Generate status report
            generate_status_report();
        }
    }

    void update_system_status() {
        std::lock_guard<std::mutex> lock(status_mutex);
        
        system_status.component_status.clear();
        system_status.running_components = 0;
        system_status.error_components = 0;
        
        for (const auto& [name, component] : components) {
            system_status.component_status[name] = component.status;
            
            if (component.status == ComponentStatus::RUNNING) {
                system_status.running_components++;
            } else if (component.status == ComponentStatus::ERROR || 
                       component.status == ComponentStatus::CRASHED) {
                system_status.error_components++;
            }
        }
    }

    void generate_status_report() {
        std::lock_guard<std::mutex> lock(status_mutex);
        
        auto now = std::chrono::system_clock::now();
        auto uptime = std::chrono::duration_cast<std::chrono::hours>(
            now - system_status.start_time);

        std::string report = "=== Status Report ===\n";
        report += "System uptime: " + std::to_string(uptime.count()) + " hours\n";
        report += "Total components: " + std::to_string(system_status.total_components) + "\n";
        report += "Running components: " + std::to_string(system_status.running_components) + "\n";
        report += "Error components: " + std::to_string(system_status.error_components) + "\n\n";

        report += "Component Status:\n";
        for (const auto& [name, status] : system_status.component_status) {
            report += "  " + name + ": " + status_to_string(status) + "\n";
        }

        if (!system_status.errors.empty()) {
            report += "\nErrors:\n";
            for (const auto& error : system_status.errors) {
                report += "  - " + error + "\n";
            }
        }

        if (!system_status.warnings.empty()) {
            report += "\nWarnings:\n";
            for (const auto& warning : system_status.warnings) {
                report += "  - " + warning + "\n";
            }
        }

        log("Status report generated");
        
        // Save report to file
        std::ofstream report_file("logs/status_report.txt");
        if (report_file.is_open()) {
            report_file << report;
            report_file.close();
        }
    }

    std::string status_to_string(ComponentStatus status) {
        switch (status) {
        case ComponentStatus::STOPPED: return "STOPPED";
        case ComponentStatus::STARTING: return "STARTING";
        case ComponentStatus::RUNNING: return "RUNNING";
        case ComponentStatus::STOPPING: return "STOPPING";
        case ComponentStatus::ERROR: return "ERROR";
        case ComponentStatus::CRASHED: return "CRASHED";
        default: return "UNKNOWN";
        }
    }

    void create_pid_file() {
        std::ofstream pid_file(config.pid_file);
        if (pid_file.is_open()) {
            pid_file << getpid();
            pid_file.close();
        }
    }

    void remove_pid_file() {
        fs::remove(config.pid_file);
    }

public:
    // Component management
    bool restart_component(const std::string& name) {
        if (components.find(name) == components.end()) {
            log("Component not found: " + name);
            return false;
        }

        log("Restarting component: " + name);
        stop_component(name);
        std::this_thread::sleep_for(std::chrono::seconds(2));
        return start_component(name);
    }

    bool stop_component_public(const std::string& name) {
        if (components.find(name) == components.end()) {
            log("Component not found: " + name);
            return false;
        }

        log("Stopping component: " + name);
        stop_component(name);
        return true;
    }

    bool start_component_public(const std::string& name) {
        if (components.find(name) == components.end()) {
            log("Component not found: " + name);
            return false;
        }

        log("Starting component: " + name);
        return start_component(name);
    }

    // Status and monitoring
    SystemStatus get_system_status() const {
        std::lock_guard<std::mutex> lock(status_mutex);
        return system_status;
    }

    std::map<std::string, ComponentStatus> get_component_status() const {
        std::lock_guard<std::mutex> lock(status_mutex);
        return system_status.component_status;
    }

    bool is_running() const {
        return running;
    }

    // Configuration methods
    void set_debug(bool debug) {
        config.debug = debug;
    }

    void set_log_level(const std::string& level) {
        config.log_level = level;
    }

    void set_heartbeat_interval(int interval) {
        config.heartbeat_interval = interval;
    }

    void set_auto_restart(bool enabled) {
        config.auto_restart = enabled;
        for (auto& [name, component] : components) {
            component.auto_restart = enabled;
        }
    }

    // Utility methods
    void reload_configuration() {
        log("Reloading configuration");
        load_config();
        
        // Restart components that need configuration reload
        for (auto& [name, component] : components) {
            if (component.status == ComponentStatus::RUNNING) {
                restart_component(name);
            }
        }
    }

    void clear_logs() {
        log("Clearing component logs");
        for (auto& [name, component] : components) {
            if (component.log_stream.is_open()) {
                component.log_stream.close();
            }
            component.log_stream.open(component.log_file, std::ios::trunc);
        }
    }

    std::string get_component_log(const std::string& name, int lines = 100) {
        if (components.find(name) == components.end()) {
            return "Component not found: " + name;
        }

        std::ifstream log_file(components[name].log_file);
        if (!log_file.is_open()) {
            return "Could not open log file for " + name;
        }

        std::vector<std::string> log_lines;
        std::string line;
        while (std::getline(log_file, line)) {
            log_lines.push_back(line);
        }

        std::string result;
        int start = std::max(0, static_cast<int>(log_lines.size()) - lines);
        for (int i = start; i < log_lines.size(); ++i) {
            result += log_lines[i] + "\n";
        }

        return result;
    }
};

// Global orchestrator instance
TrafficSecurityOrchestrator* g_orchestrator = nullptr;

// Signal handler wrapper
void signal_handler_wrapper(int signal) {
    if (g_orchestrator) {
        switch (signal) {
        case SIGINT:
        case SIGTERM:
            g_orchestrator->stop();
            break;
        case SIGUSR1:
            g_orchestrator->reload_configuration();
            break;
        case SIGUSR2:
            g_orchestrator->generate_status_report();
            break;
        }
    }
}

// Main function
int main(int argc, char* argv[]) {
    // Parse command line arguments
    bool daemon_mode = false;
    std::string config_file;
    
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        
        if (arg == "--help" || arg == "-h") {
            std::cout << "Traffic Security System Orchestrator\n\n";
            std::cout << "Usage: " << argv[0] << " [options]\n\n";
            std::cout << "Options:\n";
            std::cout << "  --daemon              Run in daemon mode\n";
            std::cout << "  --config FILE         Configuration file\n";
            std::cout << "  --debug               Enable debug output\n";
            std::cout << "  --help, -h            Show this help message\n";
            return 0;
        } else if (arg == "--daemon") {
            daemon_mode = true;
        } else if (arg == "--config" && i + 1 < argc) {
            config_file = argv[++i];
        } else if (arg == "--debug") {
            // Debug will be set after orchestrator creation
        }
    }

    // Create orchestrator
    g_orchestrator = new TrafficSecurityOrchestrator();
    
    // Set debug mode if requested
    for (int i = 1; i < argc; ++i) {
        if (std::string(argv[i]) == "--debug") {
            g_orchestrator->set_debug(true);
            break;
        }
    }

    // Daemonize if requested
    if (daemon_mode) {
        if (daemon(0, 0) != 0) {
            std::cerr << "Failed to daemonize" << std::endl;
            return 1;
        }
    }

    // Start orchestrator
    if (!g_orchestrator->start()) {
        std::cerr << "Failed to start orchestrator" << std::endl;
        delete g_orchestrator;
        return 1;
    }

    // Wait for shutdown signal
    std::unique_lock<std::mutex> lock(g_orchestrator->get_system_status().running ? 
                                     std::mutex() : std::mutex());
    g_orchestrator->get_system_status().running ? 
        std::condition_variable().wait(lock) : std::condition_variable().wait_for(lock, 
        std::chrono::seconds(1));

    // Cleanup
    delete g_orchestrator;
    return 0;
} 