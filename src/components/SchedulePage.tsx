import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Calendar, Clock, Video, Loader2, PlayCircle, ExternalLink } from 'lucide-react'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

interface ScheduleItem {
  id: number
  title: string
  meeting_time: string // HH:MM:SS
  start_date: string
  end_date: string
  meeting_link: string
  meeting_place: string
  creator?: string
  institution_name?: string
  // Calculated on frontend
  isLive: boolean
  canJoin: boolean // Can join (live or up to 1 hour late)
  nextMeeting: Date | null
  timeUntil: string
}

interface SchedulePageProps {
  userRole: 'student' | 'tutor' | 'institution'
}

export default function SchedulePage({ userRole }: SchedulePageProps) {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedule()
    // Update countdown every minute
    const interval = setInterval(updateCountdowns, 60000)
    return () => clearInterval(interval)
  }, [userRole])

  async function fetchSchedule() {
    try {
      setLoading(true)
      const token = localStorage.getItem('access')
      const userId = (await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } })).data.id

      let rawData: any[] = []

      if (userRole === 'student') {
        // Fetch enrollments that are scheduled courses
        // Note: You might need to update backend to allow filtering enrollments by course__meeting_link__isnull=False
        // For now, fetching all and filtering client side
        const res = await axios.get(`${API_BASE}/enrollments/?page_size=100`, { headers: { Authorization: `Bearer ${token}` } })
        rawData = res.data.results
          .map((e: any) => e.course)
          .filter((c: any) => c.meeting_link && c.meeting_time)
      } else {
        // Tutor/Institution: Fetch courses they created that are scheduled
        const res = await axios.get(`${API_BASE}/courses/?creator=${userId}&page_size=100`, { headers: { Authorization: `Bearer ${token}` } })
        rawData = res.data.results.filter((c: any) => c.meeting_link && c.meeting_time)
      }

      const processed = rawData.map(processScheduleItem)
      setItems(processed.sort((a, b) => (a.nextMeeting?.getTime() || 0) - (b.nextMeeting?.getTime() || 0)))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function processScheduleItem(course: any): ScheduleItem {
    const now = new Date()
    const [hours, minutes] = course.meeting_time.split(':').map(Number)
    
    // Check if within date range of the course
    const startDate = new Date(course.start_date)
    const endDate = new Date(course.end_date)
    // Fix comparison for end date to include the full day
    endDate.setHours(23, 59, 59)

    // Determine next meeting date
    let nextDate = new Date()
    nextDate.setHours(hours, minutes, 0, 0)

    // Calculate the late join end time for TODAY
    const todayLateJoinEnd = new Date(nextDate.getTime() + 60 * 60000) // 1 hour after today's start time
    
    // If we're past the late join window for today, move to tomorrow
    // Otherwise, keep today's date (we might still be in the join window)
    if (now > todayLateJoinEnd) {
      nextDate.setDate(nextDate.getDate() + 1)
    }

    // Determine status
    // Active window: 15 mins before to 2 hours after start
    const windowStart = new Date(nextDate.getTime() - 15 * 60000)
    const windowEnd = new Date(nextDate.getTime() + 120 * 60000) // 2 hour duration assumption
    
    const isLive = now >= windowStart && now <= windowEnd && nextDate >= startDate && nextDate <= endDate
    
    // Late join window: up to 1 hour after class start (for students who arrive late)
    const lateJoinEnd = new Date(nextDate.getTime() + 60 * 60000) // 1 hour after start
    const canJoin = now >= nextDate && now <= lateJoinEnd && nextDate >= startDate && nextDate <= endDate
    
    // If next meeting is past end date, it's finished
    if (nextDate > endDate) {
        return { ...course, isLive: false, canJoin: false, nextMeeting: null, timeUntil: 'Course Ended' }
    }

    // Calculate time until
    const diffMs = nextDate.getTime() - now.getTime()
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffMins = Math.floor((diffMs % 3600000) / 60000)
    
    let timeUntil = ''
    if (isLive) timeUntil = 'Happening Now'
    else if (canJoin && !isLive) timeUntil = 'Late Join Available'
    else if (diffHrs > 24) timeUntil = `in ${Math.floor(diffHrs/24)} days`
    else if (diffHrs >= 0) timeUntil = `in ${diffHrs}h ${diffMins}m`
    else timeUntil = 'Starting Soon'

    return {
      ...course,
      isLive,
      canJoin: isLive || canJoin,
      nextMeeting: nextDate,
      timeUntil
    }
  }

  function updateCountdowns() {
    setItems(prev => prev.map(item => processScheduleItem(item)))
  }

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Live Class Schedule</h2>
        <div className="text-sm text-gray-500">Local Time: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-gray-300">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No scheduled classes</h3>
          <p className="text-gray-500 mt-1">You don't have any upcoming live lessons.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item.id} className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${item.isLive ? 'border-green-500 ring-1 ring-green-500 shadow-md' : 'border-gray-200'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Info Section */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {item.isLive && (
                      <span className="animate-pulse px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wide">
                        ● Live Now
                      </span>
                    )}
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.meeting_time.slice(0,5)} Daily/Weekly
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    Instructor: {item.creator || item.institution_name || 'Tutor'} • Platform: {item.meeting_place}
                  </div>
                </div>

                {/* Countdown & Action */}
                <div className="flex flex-col md:items-end gap-3 min-w-[200px]">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Next Session</div>
                    <div className={`text-xl font-mono font-medium ${item.isLive ? 'text-green-600' : 'text-gray-800'}`}>
                      {item.timeUntil}
                    </div>
                    {item.nextMeeting && (
                        <div className="text-xs text-gray-400">
                            {item.nextMeeting.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'})}
                        </div>
                    )}
                  </div>

                  {userRole === 'student' ? (
                    <a 
                      href={item.canJoin ? item.meeting_link : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                        item.canJoin 
                          ? item.isLive
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-200' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={(e) => !item.canJoin && e.preventDefault()}
                      title={!item.canJoin ? 'Class has ended' : item.isLive ? 'Join ongoing class' : 'Join late (within 1 hour of start)'}
                    >
                      <Video className="w-4 h-4" />
                      {item.isLive ? 'Join Class' : item.canJoin ? 'Join Late' : 'Join Class'}
                    </a>
                  ) : (
                    <a 
                      href={item.canJoin ? item.meeting_link : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                        item.canJoin 
                          ? item.isLive
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg' 
                            : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={(e) => !item.canJoin && e.preventDefault()}
                      title={!item.canJoin ? 'Class has ended' : item.isLive ? 'Go live' : 'Class in progress (within 1 hour of start)'}
                    >
                      <Video className="w-4 h-4" />
                      {item.isLive ? 'Go Live' : item.canJoin ? 'Go Live' : 'Go Live'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}