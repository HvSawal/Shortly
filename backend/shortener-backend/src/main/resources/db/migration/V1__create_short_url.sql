create table if not exists short_url (
  id bigserial primary key,
  original_url text not null,
  preview_enabled boolean not null default false,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  click_count bigint not null default 0
);

create index if not exists idx_short_url_expires_at on short_url(expires_at);