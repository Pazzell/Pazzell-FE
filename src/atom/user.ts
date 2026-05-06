
import { UserData } from "@/types";
import { atomWithStorage } from "jotai/utils";


export const initializeUserAtom = () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
};

export const userAtom = atomWithStorage<UserData | null>("user", initializeUserAtom());