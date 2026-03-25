package kmp.ct07.scholarhub.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Cấu hình Thread Pool cho @Async processing
 * 
 * Giúp optimize performance cho document processing worker
 * 
 * Luồng xử lý:
 * - Core threads: 5 (luôn sẵn sàng)
 * - Max threads: 10 (khi cần thiết)
 * - Queue: 100 tasks (nếu vượt quá sẽ reject)
 */
@Configuration
@EnableAsync
@Slf4j
public class AsyncConfig {

    /**
     * Tạo ThreadPoolTaskExecutor cho async processing
     * 
     * @return Executor bean sử dụng cho @Async annotation
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Số thread sẽ tạo ngay từ đầu
        executor.setCorePoolSize(5);
        
        // Số thread tối đa có thể tạo
        executor.setMaxPoolSize(10);
        
        // Số task có thể queue (chờ) khi toàn bộ thread bận
        executor.setQueueCapacity(100);
        
        // Tên của các thread (giúp debug dễ hơn)
        executor.setThreadNamePrefix("material-processor-");
        
        // Khi queue đầy, sử dụng CallerRunsPolicy (execute in caller thread)
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        
        // Timeout khi shutdown (chờ task hoàn thành)
        executor.setAwaitTerminationSeconds(60);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        
        executor.initialize();
        
        log.info("✅ AsyncConfig initialized: " +
                "coreSize=5, maxSize=10, queueCapacity=100");
        
        return executor;
    }
}

