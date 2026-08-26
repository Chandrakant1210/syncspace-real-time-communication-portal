import { useCallback, useEffect, useRef, useState } from "react";

import { rooms as roomsApi } from "../services/api";
import { describeRoomError } from "../utils/roomError";

/**
 * Loads `GET /api/rooms` (every room the caller is a member of) and keeps it
 * refreshable. Shared by the dashboard's "My Rooms" strip and the /rooms page.
 *
 * `reload({ silent: true })` refetches without flipping back to the skeleton
 * state — used after create/join/leave so the grid does not flash.
 */
export default function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);

  // A request can outlive the component (navigating away mid-flight).
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* Written with .then/.catch rather than await so the state updates live in
     callbacks — an effect body may not update state synchronously. */
  const fetchRooms = useCallback(
    () =>
      roomsApi
        .myRooms()
        .then((data) => {
          if (!mounted.current) return null;

          const list = Array.isArray(data?.rooms) ? data.rooms : [];
          setRooms(list);
          setError(null);
          setStatus("ready");
          return list;
        })
        .catch((caught) => {
          if (!mounted.current) return null;
          setError(describeRoomError(caught, "load"));
          setStatus("error");
          return null;
        }),
    []
  );

  /** Event-handler entry point — shows the skeleton unless `silent`. */
  const reload = useCallback(
    ({ silent = false } = {}) => {
      if (!silent) setStatus("loading");
      return fetchRooms();
    },
    [fetchRooms]
  );

  useEffect(() => {
    fetchRooms(); // status already starts as "loading"
  }, [fetchRooms]);

  return { rooms, status, error, reload, setRooms };
}
