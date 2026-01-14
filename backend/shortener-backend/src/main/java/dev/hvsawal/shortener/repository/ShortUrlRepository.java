package dev.hvsawal.shortener.repository;

import dev.hvsawal.shortener.domain.ShortUrlEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ShortUrlRepository extends JpaRepository<ShortUrlEntity, Long> {

    Optional<ShortUrlEntity> findByUrlHash(String urlHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ShortUrlEntity s set s.clickCount = s.clickCount + :delta where s.id = :id")
    int incrementClickCount(@Param("id") long id, @Param("delta") long delta);
}
