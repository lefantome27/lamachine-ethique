#include <windows.h>
#include <commctrl.h>
#include <shellapi.h>
#include <iostream>
#include <string>
#include <vector>
#include <thread>
#include <mutex>
#include <chrono>
#include <fstream>
#include <sstream>
#include <memory>
#include <functional>

#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "shell32.lib")

// Window class name
const wchar_t* WINDOW_CLASS_NAME = L"CounterAttacksGUI";
const wchar_t* WINDOW_TITLE = L"Système de Contre-Attaques - Analyseur de Trafic";

// Control IDs
enum ControlIDs {
    ID_BUTTON_START = 1001,
    ID_BUTTON_STOP = 1002,
    ID_BUTTON_CONFIG = 1003,
    ID_BUTTON_REPORT = 1004,
    ID_BUTTON_EXIT = 1005,
    ID_EDIT_LOG = 1006,
    ID_LIST_ATTACKS = 1007,
    ID_PROGRESS_STATUS = 1008,
    ID_STATIC_STATUS = 1009,
    ID_STATIC_COUNT = 1010
};

// Window dimensions
const int WINDOW_WIDTH = 800;
const int WINDOW_HEIGHT = 600;
const int BUTTON_WIDTH = 120;
const int BUTTON_HEIGHT = 30;
const int MARGIN = 10;
const int TEXT_HEIGHT = 20;

// Application state
struct AppState {
    bool isRunning = false;
    int attackCount = 0;
    int blockedCount = 0;
    std::chrono::system_clock::time_point lastUpdateTime;
    std::mutex stateMutex;
};

// Global variables
HWND g_hMainWindow = nullptr;
HWND g_hEditLog = nullptr;
HWND g_hListAttacks = nullptr;
HWND g_hProgressStatus = nullptr;
HWND g_hStaticStatus = nullptr;
HWND g_hStaticCount = nullptr;
HWND g_hButtonStart = nullptr;
HWND g_hButtonStop = nullptr;
HWND g_hButtonConfig = nullptr;
HWND g_hButtonReport = nullptr;
HWND g_hButtonExit = nullptr;

AppState g_appState;
std::thread g_workerThread;
bool g_workerThreadRunning = false;

// Forward declarations
LRESULT CALLBACK MainWindowProc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
void CreateControls(HWND hWnd);
void StartCounterAttack();
void StopCounterAttack();
void ShowConfigDialog();
void GenerateReport();
void UpdateStatistics();
void AddLogMessage(const std::wstring& message);
void AddAttackToList(const std::wstring& attack);
void UpdateStatusDisplay();
void WorkerThreadFunction();
void SimulateAttackDetection();

// Main entry point
int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPWSTR lpCmdLine, int nCmdShow) {
    // Initialize common controls
    INITCOMMONCONTROLSEX icex;
    icex.dwSize = sizeof(INITCOMMONCONTROLSEX);
    icex.dwICC = ICC_LISTVIEW_CLASSES | ICC_PROGRESS_CLASS | ICC_BAR_CLASSES;
    InitCommonControlsEx(&icex);

    // Register window class
    WNDCLASSEXW wc = {};
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = MainWindowProc;
    wc.hInstance = hInstance;
    wc.hIcon = LoadIcon(nullptr, IDI_APPLICATION);
    wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wc.lpszClassName = WINDOW_CLASS_NAME;
    wc.hIconSm = LoadIcon(nullptr, IDI_APPLICATION);

    if (!RegisterClassExW(&wc)) {
        MessageBoxW(nullptr, L"Window registration failed!", L"Error", MB_ICONERROR);
        return 1;
    }

    // Create main window
    g_hMainWindow = CreateWindowExW(
        WS_EX_CLIENTEDGE,
        WINDOW_CLASS_NAME,
        WINDOW_TITLE,
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT,
        WINDOW_WIDTH, WINDOW_HEIGHT,
        nullptr, nullptr, hInstance, nullptr
    );

    if (!g_hMainWindow) {
        MessageBoxW(nullptr, L"Window creation failed!", L"Error", MB_ICONERROR);
        return 1;
    }

    // Create controls
    CreateControls(g_hMainWindow);

    // Show window
    ShowWindow(g_hMainWindow, nCmdShow);
    UpdateWindow(g_hMainWindow);

    // Message loop
    MSG msg = {};
    while (GetMessage(&msg, nullptr, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    return (int)msg.wParam;
}

// Main window procedure
LRESULT CALLBACK MainWindowProc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;

    case WM_COMMAND:
        switch (LOWORD(wParam)) {
        case ID_BUTTON_START:
            StartCounterAttack();
            break;
        case ID_BUTTON_STOP:
            StopCounterAttack();
            break;
        case ID_BUTTON_CONFIG:
            ShowConfigDialog();
            break;
        case ID_BUTTON_REPORT:
            GenerateReport();
            break;
        case ID_BUTTON_EXIT:
            DestroyWindow(hWnd);
            break;
        }
        return 0;

    case WM_SIZE:
        // Resize controls if needed
        break;

    case WM_TIMER:
        if (wParam == 1) {
            UpdateStatistics();
        }
        return 0;
    }

    return DefWindowProc(hWnd, uMsg, wParam, lParam);
}

// Create controls
void CreateControls(HWND hWnd) {
    // Get client area
    RECT clientRect;
    GetClientRect(hWnd, &clientRect);

    // Create buttons
    g_hButtonStart = CreateWindowW(
        L"BUTTON", L"Démarrer",
        WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        MARGIN, MARGIN, BUTTON_WIDTH, BUTTON_HEIGHT,
        hWnd, (HMENU)ID_BUTTON_START, GetModuleHandle(nullptr), nullptr
    );

    g_hButtonStop = CreateWindowW(
        L"BUTTON", L"Arrêter",
        WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        MARGIN * 2 + BUTTON_WIDTH, MARGIN, BUTTON_WIDTH, BUTTON_HEIGHT,
        hWnd, (HMENU)ID_BUTTON_STOP, GetModuleHandle(nullptr), nullptr
    );

    g_hButtonConfig = CreateWindowW(
        L"BUTTON", L"Configuration",
        WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        MARGIN * 3 + BUTTON_WIDTH * 2, MARGIN, BUTTON_WIDTH, BUTTON_HEIGHT,
        hWnd, (HMENU)ID_BUTTON_CONFIG, GetModuleHandle(nullptr), nullptr
    );

    g_hButtonReport = CreateWindowW(
        L"BUTTON", L"Rapport",
        WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        MARGIN * 4 + BUTTON_WIDTH * 3, MARGIN, BUTTON_WIDTH, BUTTON_HEIGHT,
        hWnd, (HMENU)ID_BUTTON_REPORT, GetModuleHandle(nullptr), nullptr
    );

    g_hButtonExit = CreateWindowW(
        L"BUTTON", L"Quitter",
        WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        MARGIN * 5 + BUTTON_WIDTH * 4, MARGIN, BUTTON_WIDTH, BUTTON_HEIGHT,
        hWnd, (HMENU)ID_BUTTON_EXIT, GetModuleHandle(nullptr), nullptr
    );

    // Create status static controls
    g_hStaticStatus = CreateWindowW(
        L"STATIC", L"Statut: Arrêté",
        WS_CHILD | WS_VISIBLE | SS_LEFT,
        MARGIN, MARGIN * 2 + BUTTON_HEIGHT, 300, TEXT_HEIGHT,
        hWnd, (HMENU)ID_STATIC_STATUS, GetModuleHandle(nullptr), nullptr
    );

    g_hStaticCount = CreateWindowW(
        L"STATIC", L"Attaques détectées: 0 | Bloquées: 0",
        WS_CHILD | WS_VISIBLE | SS_LEFT,
        MARGIN, MARGIN * 3 + BUTTON_HEIGHT + TEXT_HEIGHT, 300, TEXT_HEIGHT,
        hWnd, (HMENU)ID_STATIC_COUNT, GetModuleHandle(nullptr), nullptr
    );

    // Create progress bar
    g_hProgressStatus = CreateWindowW(
        PROGRESS_CLASS, nullptr,
        WS_CHILD | WS_VISIBLE,
        MARGIN, MARGIN * 4 + BUTTON_HEIGHT + TEXT_HEIGHT * 2, 300, 20,
        hWnd, (HMENU)ID_PROGRESS_STATUS, GetModuleHandle(nullptr), nullptr
    );

    // Create list box for attacks
    g_hListAttacks = CreateWindowW(
        L"LISTBOX", nullptr,
        WS_CHILD | WS_VISIBLE | WS_VSCROLL | LBS_NOTIFY,
        MARGIN, MARGIN * 5 + BUTTON_HEIGHT + TEXT_HEIGHT * 2 + 20, 400, 200,
        hWnd, (HMENU)ID_LIST_ATTACKS, GetModuleHandle(nullptr), nullptr
    );

    // Create edit control for log
    g_hEditLog = CreateWindowW(
        L"EDIT", nullptr,
        WS_CHILD | WS_VISIBLE | WS_VSCROLL | ES_MULTILINE | ES_READONLY,
        MARGIN, MARGIN * 6 + BUTTON_HEIGHT + TEXT_HEIGHT * 2 + 20 + 200, 400, 150,
        hWnd, (HMENU)ID_EDIT_LOG, GetModuleHandle(nullptr), nullptr
    );

    // Set up fonts
    HFONT hFont = CreateFontW(16, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"MS Shell Dlg");

    // Apply font to controls
    SendMessage(g_hButtonStart, WM_SETFONT, (WPARAM)hFont, TRUE);
    SendMessage(g_hButtonStop, WM_SETFONT, (WPARAM)hFont, TRUE);
    SendMessage(g_hButtonConfig, WM_SETFONT, (WPARAM)hFont, TRUE);
    SendMessage(g_hButtonReport, WM_SETFONT, (WPARAM)hFont, TRUE);
    SendMessage(g_hButtonExit, WM_SETFONT, (WPARAM)hFont, TRUE);
    SendMessage(g_hStaticStatus, WM_SETFONT, (WPARAM)hFont, TRUE);
    SendMessage(g_hStaticCount, WM_SETFONT, (WPARAM)hFont, TRUE);
    SendMessage(g_hListAttacks, WM_SETFONT, (WPARAM)hFont, TRUE);
    SendMessage(g_hEditLog, WM_SETFONT, (WPARAM)hFont, TRUE);

    // Initialize controls
    EnableWindow(g_hButtonStop, FALSE);
    SendMessage(g_hProgressStatus, PBM_SETRANGE, 0, MAKELPARAM(0, 100));
    SendMessage(g_hProgressStatus, PBM_SETPOS, 0, 0);

    // Add test data
    AddAttackToList(L"192.168.1.100 - DDoS");
    AddAttackToList(L"10.0.0.50 - Port Scan");
    AddAttackToList(L"172.16.0.25 - Brute Force");

    // Add initial log message
    AddLogMessage(L"Système de contre-attaques initialisé");
}

// Start counter attack system
void StartCounterAttack() {
    std::lock_guard<std::mutex> lock(g_appState.stateMutex);
    
    if (g_appState.isRunning) {
        return;
    }

    g_appState.isRunning = true;
    g_appState.lastUpdateTime = std::chrono::system_clock::now();

    // Update UI
    SetWindowTextW(g_hStaticStatus, L"Statut: En cours d'exécution");
    EnableWindow(g_hButtonStart, FALSE);
    EnableWindow(g_hButtonStop, TRUE);

    // Start worker thread
    g_workerThreadRunning = true;
    g_workerThread = std::thread(WorkerThreadFunction);

    // Start timer for updates
    SetTimer(g_hMainWindow, 1, 1000, nullptr);

    AddLogMessage(L"Système de contre-attaques démarré");
}

// Stop counter attack system
void StopCounterAttack() {
    std::lock_guard<std::mutex> lock(g_appState.stateMutex);
    
    if (!g_appState.isRunning) {
        return;
    }

    g_appState.isRunning = false;

    // Update UI
    SetWindowTextW(g_hStaticStatus, L"Statut: Arrêté");
    EnableWindow(g_hButtonStart, TRUE);
    EnableWindow(g_hButtonStop, FALSE);

    // Stop worker thread
    g_workerThreadRunning = false;
    if (g_workerThread.joinable()) {
        g_workerThread.join();
    }

    // Stop timer
    KillTimer(g_hMainWindow, 1);

    AddLogMessage(L"Système de contre-attaques arrêté");
}

// Show configuration dialog
void ShowConfigDialog() {
    MessageBoxW(g_hMainWindow, 
        L"Configuration du système de contre-attaques\n\n"
        L"• Sensibilité: 0.1\n"
        L"• Seuil d'alerte: 100\n"
        L"• Seuil critique: 200\n"
        L"• Fenêtre d'analyse: 300s\n"
        L"• ML activé: Oui",
        L"Configuration", MB_OK | MB_ICONINFORMATION);

    AddLogMessage(L"Configuration affichée");
}

// Generate report
void GenerateReport() {
    std::lock_guard<std::mutex> lock(g_appState.stateMutex);
    
    std::wstring report = L"Rapport de sécurité\n\n";
    report += L"Attaques détectées: " + std::to_wstring(g_appState.attackCount) + L"\n";
    report += L"Attaques bloquées: " + std::to_wstring(g_appState.blockedCount) + L"\n";
    report += L"Taux de blocage: " + std::to_wstring(
        g_appState.attackCount > 0 ? (g_appState.blockedCount * 100 / g_appState.attackCount) : 0) + L"%\n";

    MessageBoxW(g_hMainWindow, report.c_str(), L"Rapport", MB_OK | MB_ICONINFORMATION);
    AddLogMessage(L"Rapport généré");
}

// Update statistics
void UpdateStatistics() {
    std::lock_guard<std::mutex> lock(g_appState.stateMutex);
    
    if (!g_appState.isRunning) {
        return;
    }

    // Update progress bar
    int progress = (g_appState.attackCount % 100);
    SendMessage(g_hProgressStatus, PBM_SETPOS, progress, 0);

    // Simulate occasional attack detection
    if ((rand() % 10) == 0) {
        SimulateAttackDetection();
    }
}

// Add log message
void AddLogMessage(const std::wstring& message) {
    // Get current time
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    
    std::wstringstream ss;
    ss << L"[" << std::put_time(std::localtime(&time_t), L"%H:%M:%S") << L"] " << message << L"\r\n";
    
    std::wstring logMessage = ss.str();

    // Add to edit control
    int length = GetWindowTextLengthW(g_hEditLog);
    SendMessage(g_hEditLog, EM_SETSEL, length, length);
    SendMessage(g_hEditLog, EM_REPLACESEL, FALSE, (LPARAM)logMessage.c_str());

    // Scroll to bottom
    SendMessage(g_hEditLog, EM_SCROLLCARET, 0, 0);
}

// Add attack to list
void AddAttackToList(const std::wstring& attack) {
    SendMessageW(g_hListAttacks, LB_ADDSTRING, 0, (LPARAM)attack.c_str());
}

// Update status display
void UpdateStatusDisplay() {
    std::lock_guard<std::mutex> lock(g_appState.stateMutex);
    
    std::wstring status = L"Attaques détectées: " + std::to_wstring(g_appState.attackCount) + 
                         L" | Bloquées: " + std::to_wstring(g_appState.blockedCount);
    
    SetWindowTextW(g_hStaticCount, status.c_str());
}

// Worker thread function
void WorkerThreadFunction() {
    while (g_workerThreadRunning) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        
        // Simulate work
        if (g_appState.isRunning) {
            // This is where real counter-attack logic would go
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
        }
    }
}

// Simulate attack detection
void SimulateAttackDetection() {
    std::lock_guard<std::mutex> lock(g_appState.stateMutex);
    
    g_appState.attackCount++;
    g_appState.blockedCount++;

    // Add to list
    std::wstring attack = L"Attaque simulée #" + std::to_wstring(g_appState.attackCount) + 
                         L" - IP: 192.168." + std::to_wstring(rand() % 255) + L"." + 
                         std::to_wstring(rand() % 255);
    
    AddAttackToList(attack);
    AddLogMessage(L"Attaque détectée et bloquée: " + attack);
    UpdateStatusDisplay();
} 