import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../hooks";

export const useAdminContext = () => {
  const { url, token } = useAppSelector((state) => state.app);
  const {
    companies,
    baseGroups,
    users,
    filteredUsers,
    userNameFilter,
    companyFilter,
    adminOption,
    refresh,
  } = useAppSelector((state) => state.admin);

  return {
    adminOption,
    baseGroups,
    companies,
    companyFilter,
    filteredUsers,
    refresh,
    token,
    url,
    userNameFilter,
    users,
  };
};

export const useControlsScrollHeight = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const calcScrollHeight = () => {
      if (containerRef.current && scrollRef.current) {
        const bottom = containerRef.current.getBoundingClientRect().bottom;
        const top = scrollRef.current.getBoundingClientRect().top;

        setHeight(bottom - top);
      }
    };

    calcScrollHeight();
    window.addEventListener("resize", calcScrollHeight);
    return () => {
      window.removeEventListener("resize", calcScrollHeight);
    };
  }, [scrollRef, containerRef]);

  return { scrollRef, containerRef, height };
};
