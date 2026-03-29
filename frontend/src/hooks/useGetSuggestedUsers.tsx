import { setSuggestedUsers } from "../redux/authSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import API from "../lib/api";

const useGetSuggestedUsers = (): void => {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchSuggestedUsers = async (): Promise<void> => {
            try {
                const res = await API.get('/users/suggested');
                if (res.data.success) {
                    dispatch(setSuggestedUsers(res.data.users));
                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchSuggestedUsers();
    }, [dispatch]);
};

export default useGetSuggestedUsers;
