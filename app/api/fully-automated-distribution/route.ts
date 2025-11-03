import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Get the project root directory
    const projectRoot = path.join(process.cwd());
    
    // Path to the fully automated distribution script
    const scriptPath = path.join(projectRoot, 'scripts', 'fully-automated-distribution.js');
    
    console.log('Executing fully automated distribution script:', scriptPath);
    
    // Execute the fully automated distribution script using Hardhat
    return new Promise((resolve) => {
      const child = spawn('npx', ['hardhat', 'run', scriptPath], {
        cwd: projectRoot,
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        console.log('Script output:', stdout);
        
        if (stderr) {
          console.error('Script stderr:', stderr);
        }
        
        if (code === 0) {
          resolve(NextResponse.json({
            success: true,
            message: 'Fully automated distribution completed successfully',
            output: stdout
          }));
        } else {
          resolve(NextResponse.json({
            success: false,
            error: `Script exited with code ${code}`,
            output: stdout,
            errorOutput: stderr
          }, { status: 500 }));
        }
      });
      
      child.on('error', (error) => {
        console.error('Failed to start script:', error);
        resolve(NextResponse.json({
          success: false,
          error: 'Failed to start fully automated distribution script',
          details: error.message
        }, { status: 500 }));
      });
    });
  } catch (error: any) {
    console.error('Error executing fully automated distribution:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to execute fully automated distribution',
      details: error.stack
    }, { status: 500 });
  }
}