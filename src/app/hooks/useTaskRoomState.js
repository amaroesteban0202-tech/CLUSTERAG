import { useEffect, useState } from "react";
import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
  normalizeDateOnlyString,
  resolveStoredTaskRoomDate,
} from "../utils/date.js";

const TASK_ROOM_STATE_VERSION = 3;
const getTaskRoomDefaults = ({ preferMine = false } = {}) => ({
  currentDate: getHondurasTodayStr(),
  filterMode: "all",
  ownershipFilter: preferMine ? "mine" : "all",
  rangeStart: getHondurasTodayStr(),
  rangeEnd: getHondurasTodayStr(),
});
const readTaskRoomState = (storageKey, options = {}) => {
  const defaults = getTaskRoomDefaults(options);
  if (typeof window === "undefined") return defaults;
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return defaults;
    const parsedValue = JSON.parse(rawValue);
    const parsedState = {
      currentDate: resolveStoredTaskRoomDate(
        parsedValue.currentDate,
        parsedValue.savedAt,
        defaults.currentDate,
      ),
      filterMode: ["date", "overdue", "all", "range"].includes(
        parsedValue.filterMode,
      )
        ? parsedValue.filterMode
        : defaults.filterMode,
      ownershipFilter: ["all", "mine"].includes(parsedValue.ownershipFilter)
        ? parsedValue.ownershipFilter
        : defaults.ownershipFilter,
      rangeStart:
        normalizeDateOnlyString(parsedValue.rangeStart) || defaults.rangeStart,
      rangeEnd:
        normalizeDateOnlyString(parsedValue.rangeEnd) || defaults.rangeEnd,
    };
    const savedVersion = Number(parsedValue.version || 0);
    const wasPersonalized = parsedValue.personalized === true;
    const looksLikeLegacyDefault =
      (!wasPersonalized || savedVersion < TASK_ROOM_STATE_VERSION) &&
      parsedState.filterMode === "date" &&
      parsedState.ownershipFilter === "all" &&
      compareDateOnlyStrings(parsedState.currentDate, defaults.currentDate) ===
        0;
    if (looksLikeLegacyDefault) return defaults;
    return parsedState;
  } catch (error) {
    console.warn(`No se pudo leer el estado guardado de ${storageKey}:`, error);
    return defaults;
  }
};
export const useTaskRoomState = (storageKey, options = {}) => {
  const preferMine = Boolean(options.preferMine);
  const [roomState, setRoomState] = useState(() =>
    readTaskRoomState(storageKey, { preferMine }),
  );

  useEffect(() => {
    const nextState = readTaskRoomState(storageKey, { preferMine });
    setRoomState((current) => {
      const hasChanges =
        nextState.currentDate !== current.currentDate ||
        nextState.filterMode !== current.filterMode ||
        nextState.ownershipFilter !== current.ownershipFilter ||
        nextState.rangeStart !== current.rangeStart ||
        nextState.rangeEnd !== current.rangeEnd;
      return hasChanges ? nextState : current;
    });
  }, [storageKey, preferMine]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...roomState,
        currentDate:
          normalizeDateOnlyString(roomState.currentDate) ||
          getHondurasTodayStr(),
        savedAt: getHondurasTodayStr(),
        version: TASK_ROOM_STATE_VERSION,
        personalized: preferMine,
      }),
    );
  }, [storageKey, roomState, preferMine]);

  return {
    currentDate: roomState.currentDate,
    filterMode: roomState.filterMode,
    ownershipFilter: roomState.ownershipFilter,
    rangeStart: roomState.rangeStart,
    rangeEnd: roomState.rangeEnd,
    setCurrentDate: (value) =>
      setRoomState((current) => ({
        ...current,
        currentDate:
          typeof value === "function" ? value(current.currentDate) : value,
      })),
    setFilterMode: (value) =>
      setRoomState((current) => ({
        ...current,
        filterMode:
          typeof value === "function" ? value(current.filterMode) : value,
      })),
    setOwnershipFilter: (value) =>
      setRoomState((current) => ({
        ...current,
        ownershipFilter:
          typeof value === "function" ? value(current.ownershipFilter) : value,
      })),
    setRangeStart: (value) =>
      setRoomState((current) => ({
        ...current,
        rangeStart:
          typeof value === "function" ? value(current.rangeStart) : value,
      })),
    setRangeEnd: (value) =>
      setRoomState((current) => ({
        ...current,
        rangeEnd: typeof value === "function" ? value(current.rangeEnd) : value,
      })),
  };
};
