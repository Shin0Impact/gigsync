import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfilePicture from "../../../components/user/ProfilePicture";
import { ROUTES } from "../../../routes/routePaths";
import { useSearchUsersQuery } from "../searchApi";
import { SearchToolbar } from "./SearchToolbar";
import styles from "./ArtistSearch.module.css";

export function PeopleSearch() {
	const [text, setText] = useState("");
	const [debounced, setDebounced] = useState("");

	useEffect(() => {
		const id = setTimeout(() => setDebounced(text.trim().replace(/^@/, "")), 300);
		return () => clearTimeout(id);
	}, [text]);

	const ready = debounced.length >= 2;
	const { data, isFetching, error } = useSearchUsersQuery(debounced, { skip: !ready });
	const users = ready ? (data?.users ?? []) : [];

	return (
		<div className={styles.container}>
			<SearchToolbar
				value={text}
				onChange={setText}
				placeholder="Search people by name or @handle…"
				ariaLabel="Search people"
			/>

			<section className={styles.resultsSection}>
				{!ready && <p className={styles.emptyText}>Type at least 2 characters to search.</p>}
				{ready && isFetching && <div className={styles.loading}>Searching…</div>}
				{ready && !isFetching && error && (
					<div className={styles.error}>Something went wrong searching. Please try again.</div>
				)}
				{ready && !isFetching && !error && users.length === 0 && (
					<p className={styles.emptyText}>No one found for “{debounced}”.</p>
				)}

				{users.length > 0 && (
					<ul className={styles.resultsList}>
						{users.map((user) => (
							<li
								key={user.userId}
								className={styles.resultItem}>
								<Link
									to={ROUTES.PROFILE(user.userName)}
									className={styles.resultLink}>
									<ProfilePicture
										avatarUrl={user.avatarUrl}
										userName={user.userName}
										variant="nav"
									/>
									<div className={styles.resultInfo}>
										<span className={styles.resultName}>
											{user.name || user.userName}
											{user.isVerified && " ✓"}
										</span>
										<div className={styles.resultMeta}>
											<span className={styles.resultType}>@{user.userName}</span>
											{(user.artistsType || user.role) && (
												<span className={styles.resultType}>· {user.artistsType ?? user.role}</span>
											)}
											<span className={styles.resultType}>· {user.followersNumber} followers</span>
										</div>
									</div>
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
