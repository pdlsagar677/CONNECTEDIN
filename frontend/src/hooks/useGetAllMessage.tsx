import { setMessages } from "../redux/chatSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import API from "../lib/api";

const useGetAllMessage = (): void => {
    const dispatch = useDispatch();
    const selectedUser = useSelector((store: RootState) => store.auth?.selectedUser);

    useEffect(() => {
        const fetchAllMessage = async (): Promise<void> => {
            try {
                const res = await API.get(`/message/all/${selectedUser?._id}`);
                if (res.data.success) {
                    dispatch(setMessages(res.data.messages));
                }
            } catch (error) {
                console.log(error);
            }
        }

        if (selectedUser?._id) {
            fetchAllMessage();
        }
    }, [selectedUser, dispatch]);
};

export default useGetAllMessage;
