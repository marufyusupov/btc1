import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Get the project root directory
    const projectRoot = path.join(process.cwd());
    
    // Path to the scheduled distribution script
    const scriptPath = path.join(projectRoot, 'scripts', 'scheduled-distribution.js');
    
    console.log('Executing scheduled distribution script:', scriptPath);
    
    // Execute the scheduled distribution script using Hardhat
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
            message: 'Scheduled distribution check completed',
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
          error: 'Failed to start scheduled distribution script',
          details: error.message
        }, { status: 500 }));
      });
    });
  } catch (error: any) {
    console.error('Error executing scheduled distribution:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to execute scheduled distribution',
      details: error.stack
    }, { status: 500 });
  }
}