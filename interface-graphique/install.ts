import * as fs from 'fs';
import * as path from 'path';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Interfaces
interface InstallConfig {
  projectName: string;
  version: string;
  description: string;
  author: string;
  license: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
}

interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  npmVersion: string;
  typescriptVersion: string;
}

// Installation class
export class Installer {
  private config: InstallConfig;
  private systemInfo: SystemInfo;
  private baseDir: string;
  private isVerbose: boolean;

  constructor(baseDir: string = process.cwd(), verbose: boolean = false) {
    this.baseDir = baseDir;
    this.isVerbose = verbose;

    this.config = {
      projectName: 'traffic-security-system',
      version: '1.0.0',
      description: 'Système de sécurité pour l\'analyse et la détection d\'attaques réseau',
      author: 'Security Team',
      license: 'MIT',
      dependencies: [
        'electron',
        'typescript',
        '@types/node',
        'events',
        'fs',
        'path',
        'child_process'
      ],
      devDependencies: [
        '@types/electron',
        'ts-node',
        'nodemon',
        'webpack',
        'webpack-cli',
        'ts-loader'
      ],
      scripts: {
        'start': 'electron .',
        'build': 'tsc',
        'dev': 'ts-node src/main.ts',
        'watch': 'nodemon --exec ts-node src/main.ts',
        'package': 'electron-builder',
        'test': 'jest',
        'lint': 'eslint src/**/*.ts',
        'clean': 'rimraf dist build'
      }
    };

    this.systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: '',
      npmVersion: '',
      typescriptVersion: ''
    };

    this.initialize();
  }

  private initialize(): void {
    this.log('Initializing installer...');
    this.detectSystemInfo();
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (this.isVerbose) {
      console.log(logMessage);
    }
  }

  private detectSystemInfo(): void {
    try {
      this.systemInfo.nodeVersion = process.version;
      this.systemInfo.npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.systemInfo.typescriptVersion = execSync('npx tsc --version', { encoding: 'utf8' }).split(' ')[1];
    } catch (error) {
      this.log(`Warning: Could not detect some system information: ${error}`);
    }
  }

  public async install(): Promise<boolean> {
    this.log('Starting installation...');

    try {
      // Check prerequisites
      if (!await this.checkPrerequisites()) {
        return false;
      }

      // Create project structure
      if (!await this.createProjectStructure()) {
        return false;
      }

      // Initialize package.json
      if (!await this.initializePackageJson()) {
        return false;
      }

      // Install dependencies
      if (!await this.installDependencies()) {
        return false;
      }

      // Create configuration files
      if (!await this.createConfigFiles()) {
        return false;
      }

      // Create source files
      if (!await this.createSourceFiles()) {
        return false;
      }

      // Build project
      if (!await this.buildProject()) {
        return false;
      }

      // Create startup scripts
      if (!await this.createStartupScripts()) {
        return false;
      }

      this.log('Installation completed successfully!');
      return true;

    } catch (error) {
      this.log(`Installation failed: ${error}`);
      return false;
    }
  }

  private async checkPrerequisites(): Promise<boolean> {
    this.log('Checking prerequisites...');

    // Check Node.js
    if (!process.version) {
      this.log('Error: Node.js is not installed');
      return false;
    }

    // Check npm
    try {
      await execAsync('npm --version');
    } catch (error) {
      this.log('Error: npm is not installed');
      return false;
    }

    // Check TypeScript
    try {
      await execAsync('npx tsc --version');
    } catch (error) {
      this.log('Warning: TypeScript is not installed globally, will install locally');
    }

    this.log('Prerequisites check passed');
    return true;
  }

  private async createProjectStructure(): Promise<boolean> {
    this.log('Creating project structure...');

    const directories = [
      'src',
      'src/components',
      'src/utils',
      'src/types',
      'renderer',
      'renderer/assets',
      'renderer/css',
      'renderer/js',
      'dist',
      'build',
      'logs',
      'rules',
      'data',
      'reports',
      'backups',
      'temp',
      'docs',
      'tests'
    ];

    try {
      for (const dir of directories) {
        const dirPath = path.join(this.baseDir, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          this.log(`Created directory: ${dir}`);
        }
      }

      this.log('Project structure created');
      return true;
    } catch (error) {
      this.log(`Error creating project structure: ${error}`);
      return false;
    }
  }

  private async initializePackageJson(): Promise<boolean> {
    this.log('Initializing package.json...');

    try {
      const packageJson = {
        name: this.config.projectName,
        version: this.config.version,
        description: this.config.description,
        main: 'dist/main.js',
        author: this.config.author,
        license: this.config.license,
        scripts: this.config.scripts,
        dependencies: {},
        devDependencies: {},
        keywords: ['security', 'network', 'firewall', 'ddos', 'monitoring'],
        repository: {
          type: 'git',
          url: 'https://github.com/security-team/traffic-security-system.git'
        },
        bugs: {
          url: 'https://github.com/security-team/traffic-security-system/issues'
        },
        homepage: 'https://github.com/security-team/traffic-security-system#readme'
      };

      const packagePath = path.join(this.baseDir, 'package.json');
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

      this.log('package.json created');
      return true;
    } catch (error) {
      this.log(`Error creating package.json: ${error}`);
      return false;
    }
  }

  private async installDependencies(): Promise<boolean> {
    this.log('Installing dependencies...');

    try {
      // Install production dependencies
      for (const dep of this.config.dependencies) {
        this.log(`Installing dependency: ${dep}`);
        await execAsync(`npm install ${dep}`, { cwd: this.baseDir });
      }

      // Install development dependencies
      for (const dep of this.config.devDependencies) {
        this.log(`Installing dev dependency: ${dep}`);
        await execAsync(`npm install --save-dev ${dep}`, { cwd: this.baseDir });
      }

      this.log('Dependencies installed successfully');
      return true;
    } catch (error) {
      this.log(`Error installing dependencies: ${error}`);
      return false;
    }
  }

  private async createConfigFiles(): Promise<boolean> {
    this.log('Creating configuration files...');

    try {
      // TypeScript configuration
      const tsConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
          removeComments: true,
          noImplicitAny: true,
          strictNullChecks: true,
          strictFunctionTypes: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          moduleResolution: 'node',
          baseUrl: './',
          paths: {
            '@/*': ['src/*']
          }
        },
        include: [
          'src/**/*'
        ],
        exclude: [
          'node_modules',
          'dist',
          'build'
        ]
      };

      fs.writeFileSync(
        path.join(this.baseDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      // Webpack configuration
      const webpackConfig = `
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
`;

      fs.writeFileSync(path.join(this.baseDir, 'webpack.config.js'), webpackConfig);

      // ESLint configuration
      const eslintConfig = {
        parser: '@typescript-eslint/parser',
        plugins: ['@typescript-eslint'],
        extends: [
          'eslint:recommended',
          '@typescript-eslint/recommended'
        ],
        rules: {
          '@typescript-eslint/no-unused-vars': 'error',
          '@typescript-eslint/no-explicit-any': 'warn',
          'prefer-const': 'error'
        },
        env: {
          node: true,
          es6: true
        }
      };

      fs.writeFileSync(
        path.join(this.baseDir, '.eslintrc.json'),
        JSON.stringify(eslintConfig, null, 2)
      );

      // Git ignore
      const gitignore = `
node_modules/
dist/
build/
logs/
*.log
.DS_Store
.env
*.tmp
*.temp
`;

      fs.writeFileSync(path.join(this.baseDir, '.gitignore'), gitignore);

      this.log('Configuration files created');
      return true;
    } catch (error) {
      this.log(`Error creating configuration files: ${error}`);
      return false;
    }
  }

  private async createSourceFiles(): Promise<boolean> {
    this.log('Creating source files...');

    try {
      // Create main entry point
      const mainContent = `
import { TrafficAnalyzer } from './components/analysis';
import { Config } from './components/config';
import { CounterAttacksGui } from './components/counter-attacks-gui';
import { DDoSMonitor } from './components/ddos-monitor';
import { Firewall } from './components/firewall';

async function main() {
  console.log('Starting Traffic Security System...');
  
  // Initialize components
  const config = new Config();
  const analyzer = new TrafficAnalyzer();
  const ddosMonitor = new DDoSMonitor();
  const firewall = new Firewall();
  const gui = new CounterAttacksGui();
  
  // Start the system
  try {
    await gui.run();
    console.log('System started successfully');
  } catch (error) {
    console.error('Failed to start system:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
`;

      fs.writeFileSync(path.join(this.baseDir, 'src', 'main.ts'), mainContent);

      // Create component files
      const components = [
        'analysis.ts',
        'config.ts',
        'counter-attacks-gui.ts',
        'ddos-monitor.ts',
        'firewall.ts'
      ];

      for (const component of components) {
        const componentPath = path.join(this.baseDir, 'src', 'components', component);
        if (!fs.existsSync(componentPath)) {
          fs.writeFileSync(componentPath, `// ${component} component\n`);
        }
      }

      // Create HTML file for Electron
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Traffic Security System</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>Traffic Security System</h1>
            <div id="status">Initializing...</div>
        </header>
        
        <main>
            <div id="dashboard">
                <div class="panel">
                    <h2>Traffic Analysis</h2>
                    <div id="traffic-stats"></div>
                </div>
                
                <div class="panel">
                    <h2>DDoS Monitor</h2>
                    <div id="ddos-stats"></div>
                </div>
                
                <div class="panel">
                    <h2>Firewall</h2>
                    <div id="firewall-stats"></div>
                </div>
            </div>
        </main>
    </div>
    
    <script src="js/renderer.js"></script>
</body>
</html>
`;

      fs.writeFileSync(path.join(this.baseDir, 'renderer', 'index.html'), htmlContent);

      // Create CSS file
      const cssContent = `
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

#app {
    max-width: 1200px;
    margin: 0 auto;
}

header {
    background-color: #333;
    color: white;
    padding: 20px;
    border-radius: 5px;
    margin-bottom: 20px;
}

header h1 {
    margin: 0;
}

#status {
    margin-top: 10px;
    font-size: 14px;
}

#dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.panel {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.panel h2 {
    margin-top: 0;
    color: #333;
}
`;

      fs.writeFileSync(path.join(this.baseDir, 'renderer', 'css', 'style.css'), cssContent);

      // Create JavaScript renderer
      const jsContent = `
// Renderer script for Electron
const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    updateStatus('Connected');
    
    // Listen for updates from main process
    ipcRenderer.on('app-state-updated', (event, state) => {
        updateDashboard(state);
    });
    
    ipcRenderer.on('attack-detected', (event, attack) => {
        showAttackAlert(attack);
    });
});

function updateStatus(status) {
    document.getElementById('status').textContent = status;
}

function updateDashboard(state) {
    // Update dashboard with current state
    console.log('Dashboard updated:', state);
}

function showAttackAlert(attack) {
    // Show attack alert
    console.log('Attack detected:', attack);
}
`;

      fs.writeFileSync(path.join(this.baseDir, 'renderer', 'js', 'renderer.js'), jsContent);

      this.log('Source files created');
      return true;
    } catch (error) {
      this.log(`Error creating source files: ${error}`);
      return false;
    }
  }

  private async buildProject(): Promise<boolean> {
    this.log('Building project...');

    try {
      // Compile TypeScript
      await execAsync('npm run build', { cwd: this.baseDir });
      
      this.log('Project built successfully');
      return true;
    } catch (error) {
      this.log(`Error building project: ${error}`);
      return false;
    }
  }

  private async createStartupScripts(): Promise<boolean> {
    this.log('Creating startup scripts...');

    try {
      // Windows batch file
      const windowsScript = `@echo off
echo Starting Traffic Security System...
cd /d "%~dp0"
npm start
pause
`;

      fs.writeFileSync(path.join(this.baseDir, 'start.bat'), windowsScript);

      // Unix shell script
      const unixScript = `#!/bin/bash
echo "Starting Traffic Security System..."
cd "$(dirname "$0")"
npm start
`;

      fs.writeFileSync(path.join(this.baseDir, 'start.sh'), unixScript);

      // Make shell script executable on Unix systems
      if (process.platform !== 'win32') {
        fs.chmodSync(path.join(this.baseDir, 'start.sh'), '755');
      }

      this.log('Startup scripts created');
      return true;
    } catch (error) {
      this.log(`Error creating startup scripts: ${error}`);
      return false;
    }
  }

  public async uninstall(): Promise<boolean> {
    this.log('Starting uninstallation...');

    try {
      // Remove node_modules
      const nodeModulesPath = path.join(this.baseDir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        await execAsync('rm -rf node_modules', { cwd: this.baseDir });
        this.log('Removed node_modules');
      }

      // Remove dist and build directories
      const distPath = path.join(this.baseDir, 'dist');
      const buildPath = path.join(this.baseDir, 'build');
      
      if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true });
        this.log('Removed dist directory');
      }
      
      if (fs.existsSync(buildPath)) {
        fs.rmSync(buildPath, { recursive: true });
        this.log('Removed build directory');
      }

      this.log('Uninstallation completed');
      return true;
    } catch (error) {
      this.log(`Error during uninstallation: ${error}`);
      return false;
    }
  }

  public getSystemInfo(): SystemInfo {
    return { ...this.systemInfo };
  }

  public getInstallConfig(): InstallConfig {
    return { ...this.config };
  }

  public setVerbose(verbose: boolean): void {
    this.isVerbose = verbose;
  }
}

// Main function for testing
export async function main(): Promise<void> {
  const installer = new Installer(process.cwd(), true);

  console.log('Traffic Security System Installer');
  console.log('=================================');
  
  console.log('\nSystem Information:');
  const sysInfo = installer.getSystemInfo();
  console.log(`Platform: ${sysInfo.platform}`);
  console.log(`Architecture: ${sysInfo.arch}`);
  console.log(`Node.js: ${sysInfo.nodeVersion}`);
  console.log(`npm: ${sysInfo.npmVersion}`);
  console.log(`TypeScript: ${sysInfo.typescriptVersion}`);

  console.log('\nStarting installation...');
  const success = await installer.install();

  if (success) {
    console.log('\n✅ Installation completed successfully!');
    console.log('\nTo start the system:');
    console.log('  npm start');
    console.log('  or');
    console.log('  ./start.sh (Unix)');
    console.log('  start.bat (Windows)');
  } else {
    console.log('\n❌ Installation failed!');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 