import { Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BookingTimelineProps {
  startTime: string;
  endTime: string;
  bookingDate: string;
}

export default function BookingTimeline({ startTime, endTime, bookingDate }: BookingTimelineProps) {
  const { t } = useLanguage();
  
  const now = new Date();
  const startDateTime = new Date(`${bookingDate}T${startTime}`);
  const endDateTime = new Date(`${bookingDate}T${endTime}`);
  
  const totalDuration = endDateTime.getTime() - startDateTime.getTime();
  const elapsed = now.getTime() - startDateTime.getTime();
  const progressPercentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{t('timeline.start')}: {startTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{t('timeline.end')}: {endTime}</span>
        </div>
      </div>
      
      <div className="relative">
        {/* Background track */}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          {/* Progress bar */}
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Current time indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000"
          style={{ left: `${progressPercentage}%` }}
        >
          <div className="w-6 h-6 rounded-full bg-primary border-4 border-background shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-background animate-pulse" />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        <span>{t('timeline.progress')}: {Math.round(progressPercentage)}%</span>
      </div>
    </div>
  );
}
