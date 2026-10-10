## event  (rows: 2, rls_enabled: True)
Columns:
  - id: bigint (udt int8), NOT NULL IDENTITY BY DEFAULT
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
  - start_at: timestamp without time zone (udt timestamp), nullable
  - end_at: timestamp without time zone (udt timestamp), nullable
  - organizer_id: uuid (udt uuid), nullable DEFAULT gen_random_uuid()
  - descriptions: text (udt text), nullable
  - title: text (udt text), nullable
  - venue_name: text (udt text), nullable
  - location: USER-DEFINED (udt geography), nullable
  - is_recurring: boolean (udt bool), nullable DEFAULT false
  - recurring_rule: character varying (udt varchar), nullable
  - updated_at: timestamp with time zone (udt timestamptz), nullable DEFAULT now()
  - categories_needed: ARRAY (udt _ArtistCategory), nullable
  - status: USER-DEFINED (udt event_status), nullable DEFAULT 'open'::event_status
  - parent_event_id: bigint (udt int8), nullable
Constraints:
  - [FOREIGN KEY] event_organizer_id_fkey on (organizer_id) -> users.id
  - [FOREIGN KEY] event_parent_event_id_fkey on (parent_event_id) -> event.id
  - [PRIMARY KEY] event_pkey on (id)
Indexes:
  - event_pkey: CREATE UNIQUE INDEX event_pkey ON public.event USING btree (id)

## event_applications  (rows: 0, rls_enabled: True)
Columns:
  - id: uuid (udt uuid), NOT NULL DEFAULT gen_random_uuid()
  - event_id: bigint (udt int8), NOT NULL
  - artist_id: uuid (udt uuid), NOT NULL
  - status: USER-DEFINED (udt application_status), nullable DEFAULT 'pending'::application_status
  - cover_note: text (udt text), nullable
  - applied_at: timestamp with time zone (udt timestamptz), nullable DEFAULT now()
  - updated_at: timestamp with time zone (udt timestamptz), nullable DEFAULT now()
Constraints:
  - [FOREIGN KEY] event_applications_artist_id_fkey on (artist_id) -> users.id
  - [FOREIGN KEY] event_applications_event_id_fkey on (event_id) -> event.id
  - [PRIMARY KEY] event_applications_pkey on (id)
  - [UNIQUE] event_applications_event_id_artist_id_key on (artist_id)
      def: UNIQUE (event_id, artist_id)
  - [UNIQUE] event_applications_event_id_artist_id_key on (event_id)
      def: UNIQUE (event_id, artist_id)
Indexes:
  - event_applications_event_id_artist_id_key: CREATE UNIQUE INDEX event_applications_event_id_artist_id_key ON public.event_applications USING btree (event_id, artist_id)
  - event_applications_pkey: CREATE UNIQUE INDEX event_applications_pkey ON public.event_applications USING btree (id)

## event_media  (rows: 0, rls_enabled: True)
Columns:
  - id: uuid (udt uuid), NOT NULL DEFAULT gen_random_uuid()
  - event_id: bigint (udt int8), NOT NULL
  - media_type: character varying (udt varchar), NOT NULL
  - object_key: text (udt text), NOT NULL
  - alt_text: text (udt text), nullable
  - sort_order: integer (udt int4), NOT NULL DEFAULT 0
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
Constraints:
  - [FOREIGN KEY] event_media_event_id_fkey on (event_id) -> event.id
  - [PRIMARY KEY] event_media_pkey on (id)
Indexes:
  - event_media_pkey: CREATE UNIQUE INDEX event_media_pkey ON public.event_media USING btree (id)

## followings  (rows: 0, rls_enabled: True)
Columns:
  - id: bigint (udt int8), NOT NULL IDENTITY BY DEFAULT
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
  - user_id: uuid (udt uuid), nullable DEFAULT gen_random_uuid()
  - followed_id: uuid (udt uuid), NOT NULL DEFAULT gen_random_uuid()
Constraints:
  - [FOREIGN KEY] followings_followed_id_fkey on (followed_id) -> profiles.user_id
  - [FOREIGN KEY] followings_user_id_fkey on (user_id) -> users.id
  - [PRIMARY KEY] followings_pkey on (id)
Indexes:
  - followings_pkey: CREATE UNIQUE INDEX followings_pkey ON public.followings USING btree (id)

## geography_columns  (rows: ?, rls_enabled: None)
Columns:
  - f_table_catalog: name (udt name), nullable
  - f_table_schema: name (udt name), nullable
  - f_table_name: name (udt name), nullable
  - f_geography_column: name (udt name), nullable
  - coord_dimension: integer (udt int4), nullable
  - srid: integer (udt int4), nullable
  - type: text (udt text), nullable

## geometry_columns  (rows: ?, rls_enabled: None)
Columns:
  - f_table_catalog: character varying (udt varchar), nullable
  - f_table_schema: name (udt name), nullable
  - f_table_name: name (udt name), nullable
  - f_geometry_column: name (udt name), nullable
  - coord_dimension: integer (udt int4), nullable
  - srid: integer (udt int4), nullable
  - type: character varying (udt varchar), nullable

## profiles  (rows: 1, rls_enabled: True)
Columns:
  - id: bigint (udt int8), NOT NULL IDENTITY BY DEFAULT
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
  - user_name: text (udt text), NOT NULL
  - user_id: uuid (udt uuid), NOT NULL
  - avatar_url: text (udt text), nullable
  - followers_number: bigint (udt int8), NOT NULL DEFAULT '0'::bigint
  - artists_type: USER-DEFINED (udt ArtistCategory), nullable
  - is_verified: boolean (udt bool), NOT NULL DEFAULT false
  - location: USER-DEFINED (udt geography), nullable
  - is_emergency_available: boolean (udt bool), NOT NULL DEFAULT false
  - emergency_until: timestamp with time zone (udt timestamptz), nullable
Constraints:
  - [FOREIGN KEY] profiles_user_id_fkey on (user_id) -> users.id
  - [PRIMARY KEY] profiles_pkey on (id)
  - [UNIQUE] profiles_user_id_key on (user_id)
      def: UNIQUE (user_id)
  - [UNIQUE] profiles_user_name_key on (user_name)
      def: UNIQUE (user_name)
Indexes:
  - idx_profiles_emergency_available: CREATE INDEX idx_profiles_emergency_available ON public.profiles USING btree (is_emergency_available) WHERE (is_emergency_available = true)
  - idx_profiles_location: CREATE INDEX idx_profiles_location ON public.profiles USING gist (location)
  - profiles_pkey: CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)
  - profiles_user_id_key: CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id)
  - profiles_user_name_key: CREATE UNIQUE INDEX profiles_user_name_key ON public.profiles USING btree (user_name)

## roles  (rows: 1, rls_enabled: True)
Columns:
  - user_id: uuid (udt uuid), NOT NULL
  - role: USER-DEFINED (udt user_role), NOT NULL
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
Constraints:
  - [FOREIGN KEY] roles_user_id_fkey on (user_id) -> users.id
  - [PRIMARY KEY] roles_pkey on (user_id)
Indexes:
  - roles_pkey: CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (user_id)

## showcase_items  (rows: 0, rls_enabled: True)
Columns:
  - id: uuid (udt uuid), NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid (udt uuid), NOT NULL
  - sort_order: integer (udt int4), NOT NULL DEFAULT 0
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
  - event_id: bigint (udt int8), nullable
  - work_id: bigint (udt int8), nullable
Constraints:
  - [CHECK] showcase_items_exactly_one_source on (None)
      def: CHECK ((((event_id IS NOT NULL) AND (work_id IS NULL)) OR ((event_id IS NULL) AND (work_id IS NOT NULL))))
  - [FOREIGN KEY] showcase_items_event_id_fkey on (event_id) -> event.id
  - [FOREIGN KEY] showcase_items_user_id_fkey on (user_id) -> users.id
  - [FOREIGN KEY] showcase_items_work_id_fkey on (work_id) -> works.id
  - [PRIMARY KEY] showcase_items_pkey on (id)
Indexes:
  - showcase_items_pkey: CREATE UNIQUE INDEX showcase_items_pkey ON public.showcase_items USING btree (id)

## social_links  (rows: 0, rls_enabled: True)
Columns:
  - id: uuid (udt uuid), NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid (udt uuid), NOT NULL
  - platform: character varying (udt varchar), NOT NULL
  - url: text (udt text), NOT NULL
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
Constraints:
  - [FOREIGN KEY] social_links_user_id_fkey on (user_id) -> users.id
  - [PRIMARY KEY] social_links_pkey on (id)
  - [UNIQUE] social_links_user_id_platform_key on (platform)
      def: UNIQUE (user_id, platform)
  - [UNIQUE] social_links_user_id_platform_key on (user_id)
      def: UNIQUE (user_id, platform)
Indexes:
  - idx_social_links_user_id: CREATE INDEX idx_social_links_user_id ON public.social_links USING btree (user_id)
  - social_links_pkey: CREATE UNIQUE INDEX social_links_pkey ON public.social_links USING btree (id)
  - social_links_user_id_platform_key: CREATE UNIQUE INDEX social_links_user_id_platform_key ON public.social_links USING btree (user_id, platform)

## spatial_ref_sys  (rows: 0, rls_enabled: False)
Columns:
  - srid: integer (udt int4), NOT NULL
  - auth_name: character varying (udt varchar), nullable
  - auth_srid: integer (udt int4), nullable
  - srtext: character varying (udt varchar), nullable
  - proj4text: character varying (udt varchar), nullable
Constraints:
  - [CHECK] spatial_ref_sys_srid_check on (None)
      def: CHECK (((srid > 0) AND (srid <= 998999)))
  - [PRIMARY KEY] spatial_ref_sys_pkey on (srid)
Indexes:
  - spatial_ref_sys_pkey: CREATE UNIQUE INDEX spatial_ref_sys_pkey ON public.spatial_ref_sys USING btree (srid)

## update_media  (rows: 6, rls_enabled: True)
Columns:
  - id: bigint (udt int8), NOT NULL IDENTITY BY DEFAULT
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
  - update_id: bigint (udt int8), nullable
  - media_type: text (udt text), nullable
  - r2_key: text (udt text), nullable
  - mime_type: text (udt text), nullable
  - file_size: bigint (udt int8), nullable
  - sort_order: bigint (udt int8), nullable
Constraints:
  - [FOREIGN KEY] update_media_update_id_fkey on (update_id) -> work_updates.id
  - [PRIMARY KEY] update_media_pkey on (id)
Indexes:
  - update_media_pkey: CREATE UNIQUE INDEX update_media_pkey ON public.update_media USING btree (id)

## users  (rows: 1, rls_enabled: False)
Columns:
  - id: uuid (udt uuid), NOT NULL DEFAULT gen_random_uuid()
  - email: text (udt text), NOT NULL
  - password_hash: text (udt text), NOT NULL
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
  - updated_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
Constraints:
  - [PRIMARY KEY] users_pkey on (id)
  - [UNIQUE] users_email_key on (email)
      def: UNIQUE (email)
Indexes:
  - users_email_key: CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)
  - users_pkey: CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)

## verification_requests  (rows: 0, rls_enabled: True)
Columns:
  - id: uuid (udt uuid), NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid (udt uuid), NOT NULL
  - status: USER-DEFINED (udt verification_status), NOT NULL DEFAULT 'pending'::verification_status
  - id_document_key: text (udt text), NOT NULL
  - notes: text (udt text), nullable
  - reviewed_by: uuid (udt uuid), nullable
  - reviewed_at: timestamp with time zone (udt timestamptz), nullable
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
Constraints:
  - [FOREIGN KEY] verification_requests_reviewed_by_fkey on (reviewed_by) -> users.id
  - [FOREIGN KEY] verification_requests_user_id_fkey on (user_id) -> users.id
  - [PRIMARY KEY] verification_requests_pkey on (id)
Indexes:
  - idx_verification_requests_status: CREATE INDEX idx_verification_requests_status ON public.verification_requests USING btree (status)
  - idx_verification_requests_user_id: CREATE INDEX idx_verification_requests_user_id ON public.verification_requests USING btree (user_id)
  - verification_requests_pkey: CREATE UNIQUE INDEX verification_requests_pkey ON public.verification_requests USING btree (id)

## work_comments  (rows: 0, rls_enabled: True)
Columns:
  - id: bigint (udt int8), NOT NULL IDENTITY BY DEFAULT
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
  - work_id: bigint (udt int8), nullable
  - user_id: uuid (udt uuid), nullable
  - content: text (udt text), nullable
  - updated_at: timestamp with time zone (udt timestamptz), nullable
Constraints:
  - [FOREIGN KEY] work_comments_user_id_fkey on (user_id) -> users.id
  - [FOREIGN KEY] work_comments_work_id_fkey on (work_id) -> works.id
  - [PRIMARY KEY] work_comments_pkey on (id)
Indexes:
  - work_comments_pkey: CREATE UNIQUE INDEX work_comments_pkey ON public.work_comments USING btree (id)

## work_likes  (rows: 0, rls_enabled: True)
Columns:
  - id: bigint (udt int8), NOT NULL IDENTITY BY DEFAULT
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
  - work_id: bigint (udt int8), nullable
  - user_id: uuid (udt uuid), nullable DEFAULT gen_random_uuid()
Constraints:
  - [FOREIGN KEY] work_likes_user_id_fkey on (user_id) -> users.id
  - [FOREIGN KEY] work_likes_work_id_fkey on (work_id) -> works.id
  - [PRIMARY KEY] work_likes_pkey on (id)
  - [UNIQUE] work_likes_work_id_user_id_key on (work_id)
      def: UNIQUE (work_id, user_id)
  - [UNIQUE] work_likes_work_id_user_id_key on (user_id)
      def: UNIQUE (work_id, user_id)
Indexes:
  - work_likes_pkey: CREATE UNIQUE INDEX work_likes_pkey ON public.work_likes USING btree (id)
  - work_likes_work_id_user_id_key: CREATE UNIQUE INDEX work_likes_work_id_user_id_key ON public.work_likes USING btree (work_id, user_id)

## work_updates  (rows: 17, rls_enabled: True)
Columns:
  - id: bigint (udt int8), NOT NULL IDENTITY BY DEFAULT
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
  - updated_at: timestamp with time zone (udt timestamptz), nullable
  - work_id: bigint (udt int8), nullable
  - version_number: bigint (udt int8), nullable
  - description: text (udt text), nullable
Constraints:
  - [FOREIGN KEY] work_updates_work_id_fkey on (work_id) -> works.id
  - [PRIMARY KEY] work_updates_pkey on (id)
Indexes:
  - work_updates_pkey: CREATE UNIQUE INDEX work_updates_pkey ON public.work_updates USING btree (id)

## works  (rows: 10, rls_enabled: True)
Columns:
  - id: bigint (udt int8), NOT NULL IDENTITY BY DEFAULT
  - created_at: timestamp with time zone (udt timestamptz), NOT NULL DEFAULT now()
  - description: text (udt text), nullable
  - user_id: uuid (udt uuid), nullable DEFAULT auth.uid()
  - updated_at: timestamp with time zone (udt timestamptz), nullable
Constraints:
  - [FOREIGN KEY] works_user_id_fkey on (user_id) -> users.id
  - [PRIMARY KEY] posts_pkey on (id)
Indexes:
  - posts_pkey: CREATE UNIQUE INDEX posts_pkey ON public.works USING btree (id)
