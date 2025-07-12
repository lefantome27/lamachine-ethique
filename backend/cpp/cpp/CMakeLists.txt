cmake_minimum_required(VERSION 3.16)
project(SecuritySystem VERSION 1.0.0 LANGUAGES CXX)

# Configuration du compilateur
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -O2")

# Options de compilation
option(BUILD_TESTS "Build tests" OFF)
option(ENABLE_LOGGING "Enable logging" ON)
option(ENABLE_GUI "Enable GUI components" ON)

# Trouver les packages requis
find_package(PkgConfig REQUIRED)

# Pour Windows
if(WIN32)
    # Windows-specific libraries
    set(WINDOWS_LIBS ws2_32 iphlpapi winmm)
    
    # Trouver WinPcap ou Npcap
    find_path(WINPCAP_INCLUDE_DIR pcap.h
        PATHS
        "C:/WpdPack/Include"
        "C:/Program Files/Npcap/SDK/Include"
        "C:/Program Files (x86)/Npcap/SDK/Include"
    )
    
    find_library(WINPCAP_LIBRARY
        NAMES wpcap
        PATHS
        "C:/WpdPack/Lib/x64"
        "C:/WpdPack/Lib"
        "C:/Program Files/Npcap/SDK/Lib/x64"
        "C:/Program Files (x86)/Npcap/SDK/Lib/x64"
    )
    
    if(WINPCAP_INCLUDE_DIR AND WINPCAP_LIBRARY)
        set(PCAP_FOUND TRUE)
        set(PCAP_INCLUDE_DIRS ${WINPCAP_INCLUDE_DIR})
        set(PCAP_LIBRARIES ${WINPCAP_LIBRARY})
    endif()
    
    # Trouver Windows Forms (pour GUI)
    if(ENABLE_GUI)
        find_package(WindowsForms REQUIRED)
    endif()
endif()

# Pour Linux
if(UNIX AND NOT APPLE)
    # Linux-specific libraries
    pkg_check_modules(PCAP REQUIRED libpcap)
    pkg_check_modules(GTK3 REQUIRED gtk+-3.0)
    
    set(LINUX_LIBS ${PCAP_LIBRARIES} ${GTK3_LIBRARIES} pthread)
    set(LINUX_INCLUDES ${PCAP_INCLUDE_DIRS} ${GTK3_INCLUDE_DIRS})
endif()

# Pour macOS
if(APPLE)
    # macOS-specific libraries
    find_library(PCAP_LIBRARY pcap)
    find_path(PCAP_INCLUDE_DIR pcap.h)
    
    if(PCAP_LIBRARY AND PCAP_INCLUDE_DIR)
        set(PCAP_FOUND TRUE)
        set(PCAP_LIBRARIES ${PCAP_LIBRARY})
        set(PCAP_INCLUDE_DIRS ${PCAP_INCLUDE_DIR})
    endif()
    
    # Trouver Cocoa (pour GUI)
    if(ENABLE_GUI)
        find_library(COCOA_LIBRARY Cocoa)
        find_library(IOKIT_LIBRARY IOKit)
        find_library(CORE_FOUNDATION_LIBRARY CoreFoundation)
    endif()
endif()

# Vérifier que PCAP est trouvé
if(NOT PCAP_FOUND)
    message(FATAL_ERROR "libpcap not found. Please install libpcap-dev (Linux) or WinPcap/Npcap (Windows)")
endif()

# Inclure les répertoires
include_directories(${CMAKE_CURRENT_SOURCE_DIR})
include_directories(${PCAP_INCLUDE_DIRS})
if(UNIX AND NOT APPLE)
    include_directories(${LINUX_INCLUDES})
endif()

# Sources principales
set(SOURCES
    main.cpp
    analysis.cpp
    config.cpp
    counter_attacks_gui.cpp
    ddos_monitor.cpp
    firewall.cpp
    install.cpp
)

# Créer l'exécutable principal
add_executable(security_system ${SOURCES})

# Lier les bibliothèques
target_link_libraries(security_system ${PCAP_LIBRARIES})

if(WIN32)
    target_link_libraries(security_system ${WINDOWS_LIBS})
    if(ENABLE_GUI)
        target_link_libraries(security_system WindowsForms)
    endif()
elseif(UNIX AND NOT APPLE)
    target_link_libraries(security_system ${LINUX_LIBS})
    target_compile_options(security_system PRIVATE ${GTK3_CFLAGS_OTHER})
elseif(APPLE)
    if(ENABLE_GUI)
        target_link_libraries(security_system ${COCOA_LIBRARY} ${IOKIT_LIBRARY} ${CORE_FOUNDATION_LIBRARY})
    endif()
endif()

# Définitions de compilation
target_compile_definitions(security_system PRIVATE
    VERSION_MAJOR=${PROJECT_VERSION_MAJOR}
    VERSION_MINOR=${PROJECT_VERSION_MINOR}
    VERSION_PATCH=${PROJECT_VERSION_PATCH}
)

if(ENABLE_LOGGING)
    target_compile_definitions(security_system PRIVATE ENABLE_LOGGING)
endif()

if(ENABLE_GUI)
    target_compile_definitions(security_system PRIVATE ENABLE_GUI)
endif()

# Installation
install(TARGETS security_system
    RUNTIME DESTINATION bin
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)

# Tests (optionnel)
if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

# Configuration des fichiers de sortie
set_target_properties(security_system PROPERTIES
    OUTPUT_NAME "security_system"
    DEBUG_POSTFIX "_d"
    RELEASE_POSTFIX ""
)

# Messages de configuration
message(STATUS "Building Security System v${PROJECT_VERSION}")
message(STATUS "C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "PCAP Found: ${PCAP_FOUND}")
message(STATUS "GUI Enabled: ${ENABLE_GUI}")
message(STATUS "Logging Enabled: ${ENABLE_LOGGING}") 