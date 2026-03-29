import { setUserProfile } from "../redux/authSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import API from "../lib/api";

const useGetUserProfile = (userId: string | undefined): void => {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchUserProfile = async (): Promise<void> => {
            try {
                const res = await API.get(`/users/${userId}/profile`);
                if (res.data.success) {
                    dispatch(setUserProfile(res.data.user));
                }
            } catch (error) {
                console.log(error);
            }
        }

        if (userId) {
            fetchUserProfile();
        }
    }, [userId, dispatch]);
};

export default useGetUserProfile;
