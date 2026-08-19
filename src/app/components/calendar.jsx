import React, { useMemo, useState } from "react";
import { Icon } from "./icons.jsx";
import { EmptyState } from "./ui.jsx";
import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
  normalizeDateOnlyString,
} from "../utils/date.js";
import { MONTH_NAMES } from "../constants/app.constants.js";

export const CalendarGrid = ({
  events,
  onAdd,
  onEventClick,
  baseColor = "emerald",
  canAdd = true,
}) => {
  const [date, setDate] = useState(new Date());
  const userNavigatedRef = useRef(false);
  const dataDates = events
    .map((event) => normalizeDateOnlyString(event.date))
    .filter(Boolean)
    .sort();
  const stateMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const hasStateMonthData = dataDates.some((item) => item.startsWith(stateMonth));
  const fallbackDate = dataDates.length > 0 ? dataDates[dataDates.length - 1] : "";
  const displayDate =
    !userNavigatedRef.current && !hasStateMonthData && fallbackDate
      ? new Date(Number(fallbackDate.slice(0, 4)), Number(fallbackDate.slice(5, 7)) - 1, 1)
      : date;
  const daysInMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth() + 1,
    0,
  ).getDate();
  const startDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();

  let mappedColorName = LEGACY_COLOR_MAP[baseColor] || baseColor;
  const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;

  return (
    <>
      <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div
          className={`font-bold uppercase text-xs tracking-widest text-slate-500 dark:text-slate-400`}
        >
          Vista Mensual
        </div>
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => {
              userNavigatedRef.current = true;
              setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
            }}
            aria-label="Mes anterior"
            className="p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <span className="font-black text-slate-700 dark:text-slate-200 w-32 text-center text-sm uppercase">
            {MONTH_NAMES[displayDate.getMonth()]} {displayDate.getFullYear()}
          </span>
          <button
            onClick={() => {
              userNavigatedRef.current = true;
              setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
            }}
            aria-label="Mes siguiente"
            className="p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scroll">
        <div className="grid grid-cols-7 auto-rows-fr min-w-[800px] h-full">
          {["D", "L", "M", "M", "J", "V", "S"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 border-r border-b border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10"
            >
              {d}
            </div>
          ))}
          {Array(startDay)
            .fill(null)
            .map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border-r border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
              />
            ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const dStr = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const dayEvents = events.filter((e) => e.date === dStr);

            return (
              <div
                key={d}
                onClick={() => {
                  if (canAdd) onAdd(dStr);
                }}
                className={`border-r border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 min-h-[120px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative ${canAdd ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-purple-500 dark:group-hover:text-purple-400`}
                >
                  {d}
                </span>
                <div className="mt-2 space-y-1.5">
                  {dayEvents.map((e) => {
                    const isCompleted =
                      e.status === "publicado" || e.status === "aprobado";
                    const itemBg = isCompleted ? "bg-emerald-500" : style.bg;
                    const itemText = isCompleted ? "text-white" : style.text;
                    const itemBorder = isCompleted
                      ? "border-emerald-600"
                      : "border-black/10 dark:border-white/5";

                    return (
                      <div
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEventClick(e);
                        }}
                        className={`text-[10px] sm:text-xs font-bold p-2 rounded-lg border shadow-sm relative group/evt cursor-pointer ${itemBg} ${itemText} ${itemBorder} hover:brightness-110 active:scale-95 transition-all flex items-center justify-between`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          {isCompleted && (
                            <Icon name="CheckCircle2" size={14} />
                          )}
                          {e.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {canAdd && (
                  <Icon
                    name="Plus"
                    className={`absolute bottom-2 right-2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity`}
                    size={16}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export const GeneralCalendarGrid = ({ activities, onDayClick, onMoveActivity }) => {
  const [viewMode, setViewMode] = useState("month");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  const SHORT_MONTHS = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
  const toDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayStr = toDateStr(new Date());
  const dataDates = activities
    .map((activity) => normalizeDateOnlyString(activity.date))
    .filter(Boolean)
    .sort();
  const stateMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const hasStateMonthData = dataDates.some((item) => item.startsWith(stateMonth));
  const fallbackDate = dataDates.length > 0 ? dataDates[dataDates.length - 1] : "";
  const displayDate =
    !hasStateMonthData && fallbackDate
      ? new Date(Number(fallbackDate.slice(0, 4)), Number(fallbackDate.slice(5, 7)) - 1, 1)
      : date;

  const getWeekDates = () => {
    const d = new Date(displayDate);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const w = new Date(d);
      w.setDate(d.getDate() + i);
      return w;
    });
  };

  const navPrev = () =>
    viewMode === "week"
      ? setDate((d) => {
          const n = new Date(displayDate);
          n.setDate(n.getDate() - 7);
          return n;
        })
      : setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));

  const navNext = () =>
    viewMode === "week"
      ? setDate((d) => {
          const n = new Date(displayDate);
          n.setDate(n.getDate() + 7);
          return n;
        })
      : setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));

  const getDateLabel = () => {
    if (viewMode === "week") {
      const wk = getWeekDates();
      const s = wk[0],
        e = wk[6];
      if (s.getMonth() === e.getMonth())
        return `${s.getDate()} – ${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
      return `${s.getDate()} ${SHORT_MONTHS[s.getMonth()]} – ${e.getDate()} ${SHORT_MONTHS[e.getMonth()]} ${e.getFullYear()}`;
    }
    return `${MONTH_NAMES[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
  };

  const handleDragStart = (e, act) => {
    setDraggedId(act.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", act.id);
  };

  const handleDrop = (e, targetDateStr) => {
    e.preventDefault();
    setDragOverDate(null);
    if (!onMoveActivity || !draggedId) return;
    const act = activities.find((a) => a.id === draggedId);
    if (act && act.date !== targetDateStr) onMoveActivity(act, targetDateStr);
    setDraggedId(null);
  };

  const renderDayCell = (dateObj) => {
    const dStr = toDateStr(dateObj);
    const dayActivities = activities.filter((a) => a.date === dStr);
    const isToday = dStr === todayStr;
    const isDragOver = dragOverDate === dStr;
    const maxVisible = viewMode === "week" ? 8 : 4;
    return (
      <div
        key={dStr}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverDate(dStr);
        }}
        onDragLeave={() => setDragOverDate((s) => (s === dStr ? null : s))}
        onDrop={(e) => handleDrop(e, dStr)}
        onClick={() => !draggedId && onDayClick(dStr)}
        className={`border-r border-b border-slate-200/60 dark:border-slate-800 p-2 transition-colors cursor-pointer group relative ${viewMode === "week" ? "min-h-[200px]" : "min-h-[120px]"} ${isToday ? "ring-2 ring-inset ring-blue-400 dark:ring-blue-500" : ""} ${isDragOver ? "!bg-blue-50 dark:!bg-blue-500/10 ring-2 ring-inset ring-blue-400" : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
      >
        <div className="flex justify-between items-start mb-2">
          <span
            className={`text-xs font-bold flex items-center justify-center ${isToday ? "bg-blue-500 text-white w-5 h-5 rounded-full" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"}`}
          >
            {dateObj.getDate()}
          </span>
          {dayActivities.length > 0 && (
            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
              {dayActivities.length}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {dayActivities.slice(0, maxVisible).map((act, idx) => (
            <div
              key={`${act.id}-${idx}`}
              draggable={Boolean(onMoveActivity)}
              onDragStart={(e) => {
                e.stopPropagation();
                handleDragStart(e, act);
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverDate(null);
              }}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate select-none bg-${act._color}-100 dark:bg-${act._color}-500/20 text-${act._color}-800 dark:text-${act._color}-400 border border-${act._color}-200 dark:border-${act._color}-500/30 ${onMoveActivity ? "cursor-grab active:cursor-grabbing" : ""} ${draggedId === act.id ? "opacity-30" : ""}`}
            >
              {act.title}
            </div>
          ))}
          {dayActivities.length > maxVisible && (
            <div className="text-[10px] font-bold text-slate-500 text-center mt-1">
              +{dayActivities.length - maxVisible} más
            </div>
          )}
        </div>
        {!draggedId && (
          <Icon
            name="ExternalLink"
            className="absolute bottom-2 right-2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
            size={14}
          />
        )}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Icon
              name="CalendarPlus"
              className="text-blue-400 dark:text-blue-500 opacity-60"
              size={24}
            />
          </div>
        )}
      </div>
    );
  };

  const weekDates = getWeekDates();

  return (
    <>
      <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("week")}
              className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "week" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "month" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
            >
              Mes
            </button>
          </div>
          <button
            onClick={() => setDate(new Date())}
            className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
          >
            Hoy
          </button>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 relative">
          <button
            onClick={navPrev}
            aria-label={
              viewMode === "week" ? "Semana anterior" : "Mes anterior"
            }
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 transition-colors"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <button
            onClick={() => {
              setPickerYear(date.getFullYear());
              setShowPicker((s) => !s);
            }}
            className="font-black text-slate-700 dark:text-slate-200 min-w-[180px] text-center text-sm uppercase hover:text-blue-500 dark:hover:text-blue-400 transition-colors px-2"
          >
            {getDateLabel()}
          </button>
          <button
            onClick={navNext}
            aria-label={
              viewMode === "week" ? "Semana siguiente" : "Mes siguiente"
            }
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 transition-colors"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
          {showPicker && (
            <div
              className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setPickerYear((y) => y - 1)}
                  aria-label="Año anterior"
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                >
                  <Icon name="ChevronLeft" size={14} />
                </button>
                <span className="font-black text-slate-800 dark:text-white text-sm">
                  {pickerYear}
                </span>
                <button
                  onClick={() => setPickerYear((y) => y + 1)}
                  aria-label="Año siguiente"
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                >
                  <Icon name="ChevronRight" size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SHORT_MONTHS.map((m, i) => {
                  const isSel =
                    pickerYear === date.getFullYear() && i === date.getMonth();
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setDate(new Date(pickerYear, i, 1));
                        setViewMode("month");
                        setShowPicker(false);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${isSel ? "bg-blue-500 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {showPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPicker(false)}
        />
      )}
      <div className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scroll">
        <div
          className="grid grid-cols-7 min-w-[800px] h-full"
          style={{ gridAutoRows: viewMode === "month" ? "1fr" : "auto" }}
        >
          {DAY_LABELS.map((d, i) => (
            <div
              key={`hdr-${i}`}
              className="py-2 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 border-r border-b border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10"
            >
              {viewMode === "week" ? `${d} ${weekDates[i]?.getDate()}` : d}
            </div>
          ))}
          {viewMode === "month" &&
            (() => {
              const startDay = new Date(
                date.getFullYear(),
                date.getMonth(),
                1,
              ).getDay();
              const daysInMonth = new Date(
                date.getFullYear(),
                date.getMonth() + 1,
                0,
              ).getDate();
              return [
                ...Array(startDay)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="border-r border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  )),
                ...Array.from({ length: daysInMonth }, (_, i) =>
                  renderDayCell(
                    new Date(date.getFullYear(), date.getMonth(), i + 1),
                  ),
                ),
              ];
            })()}
          {viewMode === "week" && weekDates.map((d) => renderDayCell(d))}
        </div>
      </div>
    </>
  );
};

