import React from "react";
import { useQuery } from "@tanstack/react-query";
import "./Leaderboard.scss";
import api from "../../../lib/axiosConfig";
import { PiUserFill } from "react-icons/pi";

const DEFAULT_AVATAR = "/assets/images/default-avatar.png";
const API_BASE_URL = import.meta.env.VITE_BASE_URL || "";

export interface LeaderboardUser {
  id: string;
  username: string;
  profile_picture: string | null;
  level: string;
  hours_watched: number;
  rank: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
}

// Fetcher using your Axios instance
const fetchLeaderboard = async (): Promise<LeaderboardResponse> => {
  const { data } = await api.get<LeaderboardResponse>("/users/leaderboard");
  return data;
};

export const Leaderboard: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery<LeaderboardResponse, Error>({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const getAvatarUrl = (path: string | null) => {
    if (!path) return DEFAULT_AVATAR;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}${path}`;
  };

  if (isLoading) {
    return <div className="user-leaderboard__loading">در حال بارگذاری...</div>;
  }

  if (isError) {
    return (
      <div className="user-leaderboard__error">
        {error?.message || "خطایی در دریافت اطلاعات رخ داد"}
      </div>
    );
  }

  const users = data?.leaderboard ?? [];

  return (
    <div className="user-leaderboard">
      <div className="user-leaderboard__list-container">
        {/* Table Header (Desktop) */}
        <div className="user-leaderboard__list-container__header">
          <div className="user-leaderboard__list-container__header__profile-group">
            <div className="user-leaderboard__list-container__header__cell user-leaderboard__list-container__header__cell--name">
              نام کاربر
            </div>
          </div>
          <div className="user-leaderboard__list-container__header__cell">سطح</div>
          <div className="user-leaderboard__list-container__header__cell">میزان تماشا</div>
          <div className="user-leaderboard__list-container__header__cell">رتبه</div>
        </div>

        {/* Table Body */}
        <div className="user-leaderboard__list-container__body-wrapper">
          {users.map((user) => (
            <div
              key={user.id}
              className="user-leaderboard__list-container__body-wrapper__row"
            >
              {/* CHILD 1: Profile Group (Avatar + Username) */}
              <div className="user-leaderboard__list-container__body-wrapper__row__profile-group">
                <div className="user-leaderboard__list-container__body-wrapper__row__cell user-leaderboard__list-container__body-wrapper__row__cell--image-only">
                  {
                    user.profile_picture ? (
                      <img
                        src={getAvatarUrl(user.profile_picture)}
                        alt={user.username}
                        className="user-leaderboard__list-container__body-wrapper__row__cell__avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                        }}
                      />
                    ) : (
                      <PiUserFill />
                    )
                  }
                </div>
                <div className="user-leaderboard__list-container__body-wrapper__row__cell user-leaderboard__list-container__body-wrapper__row__cell--name">
                  <span className="user-leaderboard__list-container__body-wrapper__row__cell__text">
                    {user.username}
                  </span>
                </div>
              </div>

              {/* CHILD 2: Level (سطح) */}
              <div className="user-leaderboard__list-container__body-wrapper__row__cell">
                <span className="user-leaderboard__list-container__body-wrapper__row__cell__text">
                  {user.level}
                </span>
              </div>

              {/* CHILD 3: Hours Watched (میزان تماشا) */}
              <div className="user-leaderboard__list-container__body-wrapper__row__cell">
                <span className="user-leaderboard__list-container__body-wrapper__row__cell__text">
                  {user.hours_watched} ساعت
                </span>
              </div>

              {/* CHILD 4: Rank (رتبه) */}
              <div className="user-leaderboard__list-container__body-wrapper__row__cell">
                <span className="user-leaderboard__list-container__body-wrapper__row__cell__text">
                  #{user.rank}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="user-leaderboard__blob" />
    </div>
  );
};

export default Leaderboard