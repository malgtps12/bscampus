import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

export async function GET() {
  try {
    const startTime = Date.now()

    const { error: dbError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })

    const dbLatency = Date.now() - startTime
    const dbConnected = !dbError

    if (dbError) {
      console.error("[Health Check] Database error:", dbError.message)
    }

    const health = {
      status: dbConnected ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        connected: dbConnected,
        latency: `${dbLatency}ms`,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      services: {
        supabase: dbConnected && dbLatency < 5000 ? "operational" : "degraded",
        api: "operational",
      },
    }

    return NextResponse.json(health, { status: dbConnected ? 200 : 503 })
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
