import { NextResponse } from 'next/server';

async function handler(request: Request) {
  try {
    // Simple test to verify the API endpoint works
    return NextResponse.json({
      success: true,
      message: 'Test automated endpoint working correctly',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in test endpoint:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to execute test'
    }, { status: 500 });
  }
}

export { handler as GET, handler as POST };