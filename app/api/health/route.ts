import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()

    const { data: dbCheck } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })

    const dbLatency = Date.now() - startTime

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        connected: dbCheck !== null || dbCheck !== undefined,
        latency: `${dbLatency}ms`,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      services: {
        supabase: dbLatency < 5000 ? "operational" : "degraded",
        api: "operational",
      },
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    console.error("[Health Check] Error:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 503 }
    )
  }
}
