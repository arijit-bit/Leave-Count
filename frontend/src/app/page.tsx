"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Info, Check } from 'lucide-react';

interface Stats {
  initialLeaves: number;
  regularWorkedDays: number;
  workedHolidays: number;
  takenLeaves: number;
  earnedLeavesFromWork: number;
  totalLeavesAvailable: number;
}

interface WorkDay {
  _id: string;
  date: string;
  isWorked: boolean;
  isLeaveTaken: boolean;
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [editForm, setEditForm] = useState({ initialLeaves: 0, earnedLeaves: 0, extraLeaves: 0, takenLeaves: 0 });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      const [holidaysRes, workDaysRes, statsRes] = await Promise.all([
        api.get('/holidays'),
        api.get('/workdays'),
        api.get('/workdays/stats')
      ]);
      setHolidays(holidaysRes.data);
      setWorkDays(workDaysRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleDayClick = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingDay = workDays.find(d => d.date === dateStr);
    
    // Cycle states: NONE -> WORKED -> LEAVE -> NONE
    let nextStatus = 'WORKED';
    if (existingDay?.isWorked) nextStatus = 'LEAVE';
    else if (existingDay?.isLeaveTaken) nextStatus = 'NONE';

    try {
      await api.post('/workdays/mark', { date: dateStr, status: nextStatus });
      fetchData(); // Refresh data to get updated stats
    } catch (err) {
      console.error('Failed to mark day', err);
    }
  };

  const handleEditClick = () => {
    if (!stats) return;
    setEditForm({
      initialLeaves: stats.initialLeaves,
      earnedLeaves: stats.earnedLeavesFromWork,
      extraLeaves: stats.totalExtraLeaves,
      takenLeaves: stats.takenLeaves
    });
    setIsEditingStats(true);
  };

  const handleSaveStats = async () => {
    if (!stats) return;
    const baseEarned = Math.floor(stats.regularWorkedDays / 7);
    const baseExtra = stats.workedHolidays;
    const baseTaken = stats.takenLeaves - (stats.offsets?.takenLeavesOffset || 0);

    const payload = {
      initialLeaves: editForm.initialLeaves,
      earnedLeavesOffset: editForm.earnedLeaves - baseEarned,
      extraLeavesOffset: editForm.extraLeaves - baseExtra,
      takenLeavesOffset: editForm.takenLeaves - baseTaken,
    };

    try {
      await api.post('/workdays/stats', payload);
      setIsEditingStats(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user) return <div className="p-8 text-center">Loading...</div>;

  // Calendar rendering logic
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-200 rounded">
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-200 rounded">
          <ChevronRight />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-gray-500 py-2">
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 gap-1 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'yyyy-MM-dd');
        const holidayReason = holidays[formattedDate];
        const isHoliday = !!holidayReason;
        const workDay = workDays.find(d => d.date === formattedDate);
        
        let bgColor = 'bg-white hover:bg-gray-50';
        let borderColor = 'border-gray-200';
        
        if (isHoliday) bgColor = 'bg-red-50';
        
        if (workDay?.isWorked) {
          bgColor = isHoliday ? 'bg-red-50' : 'bg-green-100';
          borderColor = 'border-green-500 border-2';
        } else if (workDay?.isLeaveTaken) {
          bgColor = 'bg-yellow-100';
          borderColor = 'border-yellow-300';
        } else if (isHoliday) {
           borderColor = 'border-red-200';
        }

        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        
        const cloneDay = day;

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[70px] md:min-h-[80px] p-1 md:p-2 border ${borderColor} ${bgColor} ${!isCurrentMonth ? 'opacity-40' : ''} cursor-pointer transition-colors flex flex-col relative`}
            onClick={() => handleDayClick(cloneDay)}
          >
            {workDay?.isWorked && (
              <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-[2px]">
                <Check size={10} strokeWidth={4} />
              </div>
            )}
            <div className={`text-xs md:text-sm font-medium ${isToday ? 'bg-indigo-600 text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
              {format(day, 'd')}
            </div>
            <div className="mt-auto text-[10px] md:text-xs font-semibold text-center leading-tight">
               {workDay?.isWorked ? 'Worked' : ''}
               {workDay?.isLeaveTaken ? 'Leave' : ''}
               {!workDay?.isWorked && !workDay?.isLeaveTaken && isHoliday ? 'Holiday' : ''}
            </div>
            {isHoliday && (
              <div className="text-[8px] md:text-[10px] text-center text-red-600 font-medium truncate mt-0.5 leading-tight px-1" title={holidayReason}>
                {holidayReason}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 mb-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-6 mt-6">
      <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
        
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-sm relative"><div className="absolute top-0 right-0 bg-green-500 rounded-full w-1.5 h-1.5"></div></div> Worked</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-50 border border-red-200 rounded-sm"></div> Holiday</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-50 border-2 border-green-500 rounded-sm relative"><div className="absolute top-0 right-0 bg-green-500 rounded-full w-1.5 h-1.5"></div></div> Worked on Holiday</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded-sm"></div> Leave Taken</div>
          <div className="w-full text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Info size={14}/> Click any day to toggle: Worked -{'>'} Leave Taken -{'>'} Clear
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-80">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-bold">Your Leave Stats</h3>
            {!isEditingStats && stats && (
              <button onClick={handleEditClick} className="text-xs text-indigo-600 hover:underline">
                Edit
              </button>
            )}
          </div>
          {stats ? (
            isEditingStats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Initial Leaves:</span>
                  <input type="number" className="border w-20 p-1 text-right rounded" value={editForm.initialLeaves} onChange={(e) => setEditForm({...editForm, initialLeaves: Number(e.target.value)})} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Earned Leaves:</span>
                  <input type="number" className="border w-20 p-1 text-right rounded" value={editForm.earnedLeaves} onChange={(e) => setEditForm({...editForm, earnedLeaves: Number(e.target.value)})} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Extra Leaves:</span>
                  <input type="number" className="border w-20 p-1 text-right rounded" value={editForm.extraLeaves} onChange={(e) => setEditForm({...editForm, extraLeaves: Number(e.target.value)})} />
                </div>
                <div className="flex justify-between items-center text-red-500">
                  <span className="text-sm">Taken Leaves:</span>
                  <input type="number" className="border w-20 p-1 text-right rounded text-black" value={editForm.takenLeaves} onChange={(e) => setEditForm({...editForm, takenLeaves: Number(e.target.value)})} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveStats} className="bg-indigo-600 text-white flex-1 py-1 rounded text-sm hover:bg-indigo-700">Save</button>
                  <button onClick={() => setIsEditingStats(false)} className="bg-gray-200 text-gray-800 flex-1 py-1 rounded text-sm hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Initial Leaves:</span>
                  <span className="font-semibold">{stats.initialLeaves}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Regular Worked Days:</span>
                  <span className="font-semibold">{stats.regularWorkedDays}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                   <span>↳ Earned Leaves:</span>
                   <span className="font-medium text-green-600">+{stats.earnedLeavesFromWork}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Worked Holidays:</span>
                  <span className="font-semibold">{stats.workedHolidays}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                   <span>↳ Extra Leaves:</span>
                   <span className="font-medium text-green-600">+{stats.totalExtraLeaves}</span>
                </div>
                <div className="flex justify-between items-center text-red-500">
                  <span>Taken Leaves:</span>
                  <span className="font-semibold">-{stats.takenLeaves}</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Total Available:</span>
                  <span className="text-2xl font-black text-indigo-600">{stats.totalLeavesAvailable}</span>
                </div>
                
                <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-100">
                  <strong>Rule:</strong> You earn 1 leave for every 7 days worked. Working on a national/regional holiday gives you 1 full extra leave.
                </div>
              </div>
            )
          ) : (
             <div className="text-gray-400 text-sm">Loading stats...</div>
          )}
        </div>
      </div>
    </div>
  );
}
