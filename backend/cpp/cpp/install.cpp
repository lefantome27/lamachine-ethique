#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <map>
#include <chrono>
#include <thread>
#include <filesystem>
#include <cstdlib>
#include <cstring>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#include <pwd.h>
#include <grp.h>

namespace fs = std::filesystem;

// Installation configuration
struct InstallConfig {
    std::string install_dir = "/opt/traffic_security_system";
    std::string config_dir = "/etc/traffic_security_system";
    std::string log_dir = "/var/log/traffic_security_system";
    std::string data_dir = "/var/lib/traffic_security_system";
    std::string user = "trafficsec";
    std::string group = "trafficsec";
    bool create_user = true;
    bool install_service = true;
    bool backup_existing = true;
    bool verbose = false;
    bool dry_run = false;
};

// Installation status
struct InstallStatus {
    bool success = false;
    std::vector<std::string> errors;
    std::vector<std::string> warnings;
    std::vector<std::string> info;
    std::map<std::string, std::string> installed_files;
    std::chrono::system_clock::time_point start_time;
    std::chrono::system_clock::time_point end_time;
};

// Installer class
class Installer {
private:
    InstallConfig config;
    InstallStatus status;
    std::ofstream log_file;
    std::string log_path;

    // File mappings
    std::map<std::string, std::string> source_files = {
        {"analysis.cpp", "src/analysis.cpp"},
        {"config.cpp", "src/config.cpp"},
        {"counter_attacks_gui.cpp", "src/counter_attacks_gui.cpp"},
        {"ddos_monitor.cpp", "src/ddos_monitor.cpp"},
        {"firewall.cpp", "src/firewall.cpp"},
        {"main.cpp", "src/main.cpp"}
    };

    std::map<std::string, std::string> config_files = {
        {"analysis_config.json", "config/analysis_config.json"},
        {"ddos_config.json", "config/ddos_config.json"},
        {"firewall_config.json", "config/firewall_config.json"},
        {"main_config.json", "config/main_config.json"}
    };

public:
    Installer() {
        initialize();
    }

    ~Installer() {
        if (log_file.is_open()) {
            log_file.close();
        }
    }

private:
    void initialize() {
        // Create temporary log file
        log_path = "/tmp/traffic_security_install.log";
        log_file.open(log_path, std::ios::app);
        
        status.start_time = std::chrono::system_clock::now();
        
        log("Installer initialized");
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
        
        if (config.verbose) {
            std::cout << log_message;
        }
    }

public:
    bool install() {
        log("Starting installation of Traffic Security System");
        
        try {
            // Check prerequisites
            if (!check_prerequisites()) {
                return false;
            }

            // Create backup if needed
            if (config.backup_existing && fs::exists(config.install_dir)) {
                if (!create_backup()) {
                    return false;
                }
            }

            // Create directories
            if (!create_directories()) {
                return false;
            }

            // Create user and group
            if (config.create_user) {
                if (!create_user_and_group()) {
                    return false;
                }
            }

            // Compile source files
            if (!compile_source_files()) {
                return false;
            }

            // Install binaries
            if (!install_binaries()) {
                return false;
            }

            // Install configuration files
            if (!install_config_files()) {
                return false;
            }

            // Set permissions
            if (!set_permissions()) {
                return false;
            }

            // Install systemd service
            if (config.install_service) {
                if (!install_service_file()) {
                    return false;
                }
            }

            // Create symbolic links
            if (!create_symbolic_links()) {
                return false;
            }

            // Update system configuration
            if (!update_system_config()) {
                return false;
            }

            status.success = true;
            status.end_time = std::chrono::system_clock::now();
            
            log("Installation completed successfully");
            return true;

        } catch (const std::exception& e) {
            status.errors.push_back("Installation failed: " + std::string(e.what()));
            log("Installation failed: " + std::string(e.what()));
            return false;
        }
    }

private:
    bool check_prerequisites() {
        log("Checking prerequisites...");

        // Check if running as root
        if (geteuid() != 0) {
            status.errors.push_back("Installation must be run as root");
            log("Error: Installation must be run as root");
            return false;
        }

        // Check required packages
        std::vector<std::string> required_packages = {
            "g++", "make", "cmake", "libpcap-dev", "libjsoncpp-dev"
        };

        for (const auto& package : required_packages) {
            if (!check_package_installed(package)) {
                status.warnings.push_back("Package not found: " + package);
                log("Warning: Package not found: " + package);
            }
        }

        // Check available disk space
        if (!check_disk_space()) {
            status.errors.push_back("Insufficient disk space");
            log("Error: Insufficient disk space");
            return false;
        }

        log("Prerequisites check completed");
        return true;
    }

    bool check_package_installed(const std::string& package) {
        std::string command = "which " + package + " > /dev/null 2>&1";
        return system(command.c_str()) == 0;
    }

    bool check_disk_space() {
        try {
            fs::space_info space = fs::space(config.install_dir);
            size_t required_space = 100 * 1024 * 1024; // 100 MB
            return space.available > required_space;
        } catch (const std::exception& e) {
            log("Warning: Could not check disk space: " + std::string(e.what()));
            return true; // Assume sufficient space
        }
    }

    bool create_backup() {
        log("Creating backup of existing installation...");

        try {
            std::string backup_dir = config.install_dir + ".backup." + 
                std::to_string(std::chrono::duration_cast<std::chrono::seconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count());

            fs::rename(config.install_dir, backup_dir);
            status.info.push_back("Backup created: " + backup_dir);
            log("Backup created: " + backup_dir);
            return true;
        } catch (const std::exception& e) {
            status.errors.push_back("Failed to create backup: " + std::string(e.what()));
            log("Error: Failed to create backup: " + std::string(e.what()));
            return false;
        }
    }

    bool create_directories() {
        log("Creating directories...");

        std::vector<std::string> directories = {
            config.install_dir,
            config.install_dir + "/bin",
            config.install_dir + "/lib",
            config.install_dir + "/include",
            config.install_dir + "/share",
            config.install_dir + "/share/doc",
            config.install_dir + "/share/man",
            config.config_dir,
            config.log_dir,
            config.data_dir,
            config.data_dir + "/rules",
            config.data_dir + "/cache",
            config.data_dir + "/backups"
        };

        for (const auto& dir : directories) {
            try {
                fs::create_directories(dir);
                status.info.push_back("Created directory: " + dir);
                log("Created directory: " + dir);
            } catch (const std::exception& e) {
                status.errors.push_back("Failed to create directory " + dir + ": " + std::string(e.what()));
                log("Error: Failed to create directory " + dir + ": " + std::string(e.what()));
                return false;
            }
        }

        return true;
    }

    bool create_user_and_group() {
        log("Creating user and group...");

        // Check if user/group already exists
        struct passwd* pwd = getpwnam(config.user.c_str());
        if (pwd != nullptr) {
            status.info.push_back("User already exists: " + config.user);
            log("User already exists: " + config.user);
            return true;
        }

        // Create group
        std::string groupadd_cmd = "groupadd " + config.group;
        if (system(groupadd_cmd.c_str()) != 0) {
            status.warnings.push_back("Failed to create group: " + config.group);
            log("Warning: Failed to create group: " + config.group);
        }

        // Create user
        std::string useradd_cmd = "useradd -r -g " + config.group + " -d " + 
                                 config.data_dir + " -s /bin/false " + config.user;
        if (system(useradd_cmd.c_str()) != 0) {
            status.warnings.push_back("Failed to create user: " + config.user);
            log("Warning: Failed to create user: " + config.user);
            return false;
        }

        status.info.push_back("Created user: " + config.user);
        log("Created user: " + config.user);
        return true;
    }

    bool compile_source_files() {
        log("Compiling source files...");

        // Create CMakeLists.txt
        if (!create_cmake_lists()) {
            return false;
        }

        // Create build directory
        std::string build_dir = config.install_dir + "/build";
        fs::create_directories(build_dir);

        // Run cmake
        std::string cmake_cmd = "cd " + build_dir + " && cmake ..";
        if (system(cmake_cmd.c_str()) != 0) {
            status.errors.push_back("CMake configuration failed");
            log("Error: CMake configuration failed");
            return false;
        }

        // Run make
        std::string make_cmd = "cd " + build_dir + " && make -j$(nproc)";
        if (system(make_cmd.c_str()) != 0) {
            status.errors.push_back("Compilation failed");
            log("Error: Compilation failed");
            return false;
        }

        log("Compilation completed successfully");
        return true;
    }

    bool create_cmake_lists() {
        std::string cmake_content = R"(
cmake_minimum_required(VERSION 3.10)
project(TrafficSecuritySystem)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(PkgConfig REQUIRED)
pkg_check_modules(PCAP REQUIRED libpcap)
pkg_check_modules(JSONCPP REQUIRED jsoncpp)

# Include directories
include_directories(${PCAP_INCLUDE_DIRS})
include_directories(${JSONCPP_INCLUDE_DIRS})

# Source files
set(SOURCES
    analysis.cpp
    config.cpp
    counter_attacks_gui.cpp
    ddos_monitor.cpp
    firewall.cpp
    main.cpp
)

# Create executables
add_executable(traffic_analyzer analysis.cpp)
add_executable(traffic_config config.cpp)
add_executable(traffic_gui counter_attacks_gui.cpp)
add_executable(ddos_monitor ddos_monitor.cpp)
add_executable(firewall firewall.cpp)
add_executable(traffic_main main.cpp)

# Link libraries
target_link_libraries(traffic_analyzer ${PCAP_LIBRARIES} ${JSONCPP_LIBRARIES})
target_link_libraries(traffic_config ${JSONCPP_LIBRARIES})
target_link_libraries(traffic_gui ${PCAP_LIBRARIES} ${JSONCPP_LIBRARIES})
target_link_libraries(ddos_monitor ${PCAP_LIBRARIES} ${JSONCPP_LIBRARIES})
target_link_libraries(firewall ${PCAP_LIBRARIES} ${JSONCPP_LIBRARIES})
target_link_libraries(traffic_main ${PCAP_LIBRARIES} ${JSONCPP_LIBRARIES})

# Install targets
install(TARGETS traffic_analyzer traffic_config traffic_gui ddos_monitor firewall traffic_main
        DESTINATION bin)
)";

        std::ofstream cmake_file(config.install_dir + "/CMakeLists.txt");
        if (!cmake_file.is_open()) {
            status.errors.push_back("Failed to create CMakeLists.txt");
            log("Error: Failed to create CMakeLists.txt");
            return false;
        }

        cmake_file << cmake_content;
        cmake_file.close();

        return true;
    }

    bool install_binaries() {
        log("Installing binaries...");

        std::string build_dir = config.install_dir + "/build";
        std::string bin_dir = config.install_dir + "/bin";

        std::vector<std::string> binaries = {
            "traffic_analyzer",
            "traffic_config",
            "traffic_gui",
            "ddos_monitor",
            "firewall",
            "traffic_main"
        };

        for (const auto& binary : binaries) {
            std::string source = build_dir + "/" + binary;
            std::string dest = bin_dir + "/" + binary;

            if (fs::exists(source)) {
                try {
                    fs::copy_file(source, dest, fs::copy_options::overwrite_existing);
                    status.installed_files[binary] = dest;
                    status.info.push_back("Installed binary: " + binary);
                    log("Installed binary: " + binary);
                } catch (const std::exception& e) {
                    status.errors.push_back("Failed to install binary " + binary + ": " + std::string(e.what()));
                    log("Error: Failed to install binary " + binary + ": " + std::string(e.what()));
                    return false;
                }
            } else {
                status.warnings.push_back("Binary not found: " + binary);
                log("Warning: Binary not found: " + binary);
            }
        }

        return true;
    }

    bool install_config_files() {
        log("Installing configuration files...");

        // Create default configuration files
        std::map<std::string, std::string> configs = {
            {"analysis_config.json", create_analysis_config()},
            {"ddos_config.json", create_ddos_config()},
            {"firewall_config.json", create_firewall_config()},
            {"main_config.json", create_main_config()}
        };

        for (const auto& [filename, content] : configs) {
            std::string filepath = config.config_dir + "/" + filename;
            
            std::ofstream file(filepath);
            if (!file.is_open()) {
                status.errors.push_back("Failed to create config file: " + filename);
                log("Error: Failed to create config file: " + filename);
                return false;
            }

            file << content;
            file.close();
            
            status.installed_files[filename] = filepath;
            status.info.push_back("Installed config: " + filename);
            log("Installed config: " + filename);
        }

        return true;
    }

    std::string create_analysis_config() {
        return R"({
    "analysis": {
        "enabled": true,
        "ml_enabled": true,
        "sensitivity": 0.1,
        "time_window": 300,
        "min_data_points": 10,
        "max_data_points": 10000,
        "update_interval": 60,
        "batch_size": 100,
        "confidence_threshold": 0.8
    },
    "thresholds": {
        "normal": 50,
        "warning": 100,
        "critical": 200,
        "emergency": 500,
        "baseline": 30,
        "spike_threshold": 2.0,
        "trend_threshold": 0.1
    }
})";
    }

    std::string create_ddos_config() {
        return R"({
    "enabled": true,
    "capture_timeout": 1000,
    "analysis_interval": 60,
    "alert_threshold": 100,
    "critical_threshold": 500,
    "sensitivity": 0.1,
    "time_window": 300,
    "auto_block": true,
    "block_duration": 3600
})";
    }

    std::string create_firewall_config() {
        return R"({
    "enabled": true,
    "default_policy_in": "DROP",
    "default_policy_out": "ACCEPT",
    "connection_tracking": true,
    "nat_enabled": true,
    "logging_enabled": true,
    "max_connections": 10000,
    "connection_timeout": 3600,
    "rule_check_timeout": 1000
})";
    }

    std::string create_main_config() {
        return R"({
    "general": {
        "debug": false,
        "log_level": "INFO",
        "max_log_size": 10485760,
        "backup_count": 5,
        "timezone": "Europe/Paris"
    },
    "components": {
        "analysis": true,
        "ddos_monitor": true,
        "firewall": true,
        "gui": true
    },
    "paths": {
        "install_dir": ")" + config.install_dir + R"(",
        "config_dir": ")" + config.config_dir + R"(",
        "log_dir": ")" + config.log_dir + R"(",
        "data_dir": ")" + config.data_dir + R"("
    }
})";
    }

    bool set_permissions() {
        log("Setting permissions...");

        // Set ownership
        std::string chown_cmd = "chown -R " + config.user + ":" + config.group + " " + config.install_dir;
        if (system(chown_cmd.c_str()) != 0) {
            status.warnings.push_back("Failed to set ownership");
            log("Warning: Failed to set ownership");
        }

        // Set permissions for binaries
        std::string chmod_bin_cmd = "chmod 755 " + config.install_dir + "/bin/*";
        if (system(chmod_bin_cmd.c_str()) != 0) {
            status.warnings.push_back("Failed to set binary permissions");
            log("Warning: Failed to set binary permissions");
        }

        // Set permissions for config files
        std::string chmod_config_cmd = "chmod 640 " + config.config_dir + "/*";
        if (system(chmod_config_cmd.c_str()) != 0) {
            status.warnings.push_back("Failed to set config permissions");
            log("Warning: Failed to set config permissions");
        }

        // Set permissions for log directory
        std::string chmod_log_cmd = "chmod 755 " + config.log_dir;
        if (system(chmod_log_cmd.c_str()) != 0) {
            status.warnings.push_back("Failed to set log permissions");
            log("Warning: Failed to set log permissions");
        }

        return true;
    }

    bool install_service_file() {
        log("Installing systemd service...");

        std::string service_content = R"([Unit]
Description=Traffic Security System
After=network.target

[Service]
Type=simple
User=)" + config.user + R"(
Group=)" + config.group + R"(
ExecStart=)" + config.install_dir + R"(/bin/traffic_main
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
)";

        std::string service_file = "/etc/systemd/system/traffic-security.service";
        std::ofstream file(service_file);
        if (!file.is_open()) {
            status.warnings.push_back("Failed to create systemd service file");
            log("Warning: Failed to create systemd service file");
            return false;
        }

        file << service_content;
        file.close();

        // Reload systemd
        if (system("systemctl daemon-reload") != 0) {
            status.warnings.push_back("Failed to reload systemd");
            log("Warning: Failed to reload systemd");
        }

        // Enable service
        if (system("systemctl enable traffic-security.service") != 0) {
            status.warnings.push_back("Failed to enable service");
            log("Warning: Failed to enable service");
        }

        status.info.push_back("Systemd service installed");
        log("Systemd service installed");
        return true;
    }

    bool create_symbolic_links() {
        log("Creating symbolic links...");

        std::string bin_dir = config.install_dir + "/bin";
        std::vector<std::string> links = {
            "/usr/local/bin/traffic-analyzer",
            "/usr/local/bin/traffic-config",
            "/usr/local/bin/traffic-gui",
            "/usr/local/bin/ddos-monitor",
            "/usr/local/bin/traffic-firewall"
        };

        std::vector<std::string> targets = {
            bin_dir + "/traffic_analyzer",
            bin_dir + "/traffic_config",
            bin_dir + "/traffic_gui",
            bin_dir + "/ddos_monitor",
            bin_dir + "/firewall"
        };

        for (size_t i = 0; i < links.size(); ++i) {
            try {
                if (fs::exists(links[i])) {
                    fs::remove(links[i]);
                }
                fs::create_symlink(targets[i], links[i]);
                status.info.push_back("Created symlink: " + links[i]);
                log("Created symlink: " + links[i]);
            } catch (const std::exception& e) {
                status.warnings.push_back("Failed to create symlink " + links[i] + ": " + std::string(e.what()));
                log("Warning: Failed to create symlink " + links[i] + ": " + std::string(e.what()));
            }
        }

        return true;
    }

    bool update_system_config() {
        log("Updating system configuration...");

        // Add to PATH
        std::string profile_content = "\n# Traffic Security System\n";
        profile_content += "export PATH=$PATH:" + config.install_dir + "/bin\n";

        std::ofstream profile("/etc/profile.d/traffic-security.sh");
        if (profile.is_open()) {
            profile << profile_content;
            profile.close();
            status.info.push_back("Updated system PATH");
            log("Updated system PATH");
        }

        // Create man pages
        std::string man_dir = config.install_dir + "/share/man/man1";
        fs::create_directories(man_dir);

        std::vector<std::string> man_pages = {
            "traffic-analyzer.1",
            "traffic-config.1",
            "traffic-gui.1",
            "ddos-monitor.1",
            "traffic-firewall.1"
        };

        for (const auto& man_page : man_pages) {
            std::string man_content = ".TH " + man_page.substr(0, man_page.find('.')) + " 1\n";
            man_content += ".SH NAME\n";
            man_content += man_page.substr(0, man_page.find('.')) + " \\- Traffic Security System\n";
            man_content += ".SH DESCRIPTION\n";
            man_content += "Part of the Traffic Security System.\n";

            std::ofstream man_file(man_dir + "/" + man_page);
            if (man_file.is_open()) {
                man_file << man_content;
                man_file.close();
            }
        }

        return true;
    }

public:
    // Configuration methods
    void set_install_dir(const std::string& dir) {
        config.install_dir = dir;
    }

    void set_config_dir(const std::string& dir) {
        config.config_dir = dir;
    }

    void set_log_dir(const std::string& dir) {
        config.log_dir = dir;
    }

    void set_data_dir(const std::string& dir) {
        config.data_dir = dir;
    }

    void set_user(const std::string& user) {
        config.user = user;
    }

    void set_group(const std::string& group) {
        config.group = group;
    }

    void set_create_user(bool create) {
        config.create_user = create;
    }

    void set_install_service(bool install) {
        config.install_service = install;
    }

    void set_backup_existing(bool backup) {
        config.backup_existing = backup;
    }

    void set_verbose(bool verbose) {
        config.verbose = verbose;
    }

    void set_dry_run(bool dry_run) {
        config.dry_run = dry_run;
    }

    // Getter methods
    InstallStatus get_status() const {
        return status;
    }

    std::string get_log_path() const {
        return log_path;
    }

    // Utility methods
    void print_summary() {
        auto duration = std::chrono::duration_cast<std::chrono::seconds>(
            status.end_time - status.start_time);

        std::cout << "\n=== Installation Summary ===" << std::endl;
        std::cout << "Status: " << (status.success ? "SUCCESS" : "FAILED") << std::endl;
        std::cout << "Duration: " << duration.count() << " seconds" << std::endl;
        std::cout << "Installation directory: " << config.install_dir << std::endl;
        std::cout << "Configuration directory: " << config.config_dir << std::endl;
        std::cout << "Log directory: " << config.log_dir << std::endl;
        std::cout << "Data directory: " << config.data_dir << std::endl;

        if (!status.errors.empty()) {
            std::cout << "\nErrors:" << std::endl;
            for (const auto& error : status.errors) {
                std::cout << "  - " << error << std::endl;
            }
        }

        if (!status.warnings.empty()) {
            std::cout << "\nWarnings:" << std::endl;
            for (const auto& warning : status.warnings) {
                std::cout << "  - " << warning << std::endl;
            }
        }

        if (!status.info.empty()) {
            std::cout << "\nInformation:" << std::endl;
            for (const auto& info : status.info) {
                std::cout << "  - " << info << std::endl;
            }
        }

        std::cout << "\nLog file: " << log_path << std::endl;
    }
};

// Main function
int main(int argc, char* argv[]) {
    Installer installer;

    // Parse command line arguments
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        
        if (arg == "--help" || arg == "-h") {
            std::cout << "Traffic Security System Installer\n\n";
            std::cout << "Usage: " << argv[0] << " [options]\n\n";
            std::cout << "Options:\n";
            std::cout << "  --install-dir DIR     Installation directory (default: /opt/traffic_security_system)\n";
            std::cout << "  --config-dir DIR      Configuration directory (default: /etc/traffic_security_system)\n";
            std::cout << "  --log-dir DIR         Log directory (default: /var/log/traffic_security_system)\n";
            std::cout << "  --data-dir DIR        Data directory (default: /var/lib/traffic_security_system)\n";
            std::cout << "  --user USER           User name (default: trafficsec)\n";
            std::cout << "  --group GROUP         Group name (default: trafficsec)\n";
            std::cout << "  --no-create-user      Don't create user/group\n";
            std::cout << "  --no-service          Don't install systemd service\n";
            std::cout << "  --no-backup           Don't backup existing installation\n";
            std::cout << "  --verbose             Verbose output\n";
            std::cout << "  --dry-run             Show what would be done without doing it\n";
            std::cout << "  --help, -h            Show this help message\n";
            return 0;
        } else if (arg == "--install-dir" && i + 1 < argc) {
            installer.set_install_dir(argv[++i]);
        } else if (arg == "--config-dir" && i + 1 < argc) {
            installer.set_config_dir(argv[++i]);
        } else if (arg == "--log-dir" && i + 1 < argc) {
            installer.set_log_dir(argv[++i]);
        } else if (arg == "--data-dir" && i + 1 < argc) {
            installer.set_data_dir(argv[++i]);
        } else if (arg == "--user" && i + 1 < argc) {
            installer.set_user(argv[++i]);
        } else if (arg == "--group" && i + 1 < argc) {
            installer.set_group(argv[++i]);
        } else if (arg == "--no-create-user") {
            installer.set_create_user(false);
        } else if (arg == "--no-service") {
            installer.set_install_service(false);
        } else if (arg == "--no-backup") {
            installer.set_backup_existing(false);
        } else if (arg == "--verbose") {
            installer.set_verbose(true);
        } else if (arg == "--dry-run") {
            installer.set_dry_run(true);
        }
    }

    // Run installation
    bool success = installer.install();
    
    // Print summary
    installer.print_summary();
    
    return success ? 0 : 1;
} 