package dev.hvsawal.shortener;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableCaching
@EnableRetry
@EnableScheduling
@SpringBootApplication
public class ShortenerBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ShortenerBackendApplication.class, args);
	}

}
