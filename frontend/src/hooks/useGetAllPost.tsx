import { setPosts, appendPosts } from "../redux/postSlice";
import { useEffect, useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import API from "../lib/api";

const useGetAllPost = () => {
    const dispatch = useDispatch();
    const cachedPosts = useSelector((store: RootState) => store.post?.posts || []);
    // If we have cached posts, don't show loading (instant render)
    const [loading, setLoading] = useState(cachedPosts.length === 0);
    const [hasMore, setHasMore] = useState(true);

    const pageRef = useRef(0);
    const loadingRef = useRef(false);
    const hasMoreRef = useRef(true);

    // Fetch page 1 on mount — replaces cache with fresh data (background if cache exists)
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            loadingRef.current = true;
            // Only show loading spinner if no cached posts
            if (cachedPosts.length === 0) setLoading(true);
            try {
                const res = await API.get('/post/all?page=1&limit=10');
                if (!cancelled && res.data.success) {
                    dispatch(setPosts(res.data.posts));
                    pageRef.current = 1;
                    hasMoreRef.current = res.data.hasMore;
                    setHasMore(res.data.hasMore);
                }
            } catch (e) {
                console.log(e);
            } finally {
                if (!cancelled) {
                    loadingRef.current = false;
                    setLoading(false);
                }
            }
        };
        init();
        return () => { cancelled = true; };
    }, [dispatch]);

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMoreRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        const next = pageRef.current + 1;
        try {
            const res = await API.get(`/post/all?page=${next}&limit=10`);
            if (res.data.success) {
                dispatch(appendPosts(res.data.posts));
                pageRef.current = next;
                hasMoreRef.current = res.data.hasMore;
                setHasMore(res.data.hasMore);
            }
        } catch (e) {
            console.log(e);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [dispatch]);

    return { loadMore, hasMore, isLoading: loading };
};

export default useGetAllPost;
