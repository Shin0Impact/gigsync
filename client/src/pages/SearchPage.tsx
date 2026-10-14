import { Button, Page } from "@components";
import { ArtistSearch } from "../features/search";
import { useState } from "react";

export function SearchPage() {
	return (
		<Page type="main">
			<Page.Header
				title="Find Artists"
				mode="button"
				// subtitle="Search a place, pick on the map, or use your location"
			/>
			<Page.Body>
				<ArtistSearch />
			</Page.Body>
		</Page>
	);
}

export default SearchPage;
