package kmp.ct07.scholarhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ScholarhubApplication {
	public static void main(String[] args) {
		SpringApplication.run(ScholarhubApplication.class, args);
	}

}
