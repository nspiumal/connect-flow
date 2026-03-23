package com.connectflow.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Aspect
@Component
@Slf4j
public class ServiceMethodLoggingAspect {

    @PostConstruct
    public void init() {
        log.info("========================================");
        log.info("ServiceMethodLoggingAspect ENABLED");
        log.info("Logging all service method invocations");
        log.info("========================================");
    }

    private static final String MASKED = "***MASKED***";
    private static final String REDACTED = "***REDACTED***";
    private static final int MAX_STRING_LENGTH = 160;
    private static final int MAX_COLLECTION_PREVIEW = 5;

    private static final Pattern BASE64_PATTERN = Pattern.compile("^[A-Za-z0-9+/=\\r\\n]+$");

    @Around("execution(* com.connectflow.service..*(..))")
    public Object logServiceMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String className = signature.getDeclaringType().getSimpleName();
        String methodName = method.getName();

        String sanitizedParameters = buildSanitizedParameterLog(method, joinPoint.getArgs());
        long startedAt = System.currentTimeMillis();

        log.info(">>> [START] {}.{}() | params={}", className, methodName, sanitizedParameters);

        try {
            Object result = joinPoint.proceed();
            long elapsedMs = System.currentTimeMillis() - startedAt;
            String resultSummary = summarizeReturnValue(result);

            log.info("<<< [END] {}.{}() | duration={}ms | return={}", className, methodName, elapsedMs, resultSummary);
            return result;
        } catch (Throwable throwable) {
            long elapsedMs = System.currentTimeMillis() - startedAt;
            log.error(
                "!!! [ERROR] {}.{}() | duration={}ms | exception={} | message={}",
                className,
                methodName,
                elapsedMs,
                throwable.getClass().getSimpleName(),
                safeString(throwable.getMessage())
            );
            throw throwable;
        }
    }

    private String buildSanitizedParameterLog(Method method, Object[] args) {
        if (args == null || args.length == 0) {
            return "[]";
        }

        Parameter[] parameters = method.getParameters();
        StringBuilder builder = new StringBuilder("[");

        for (int i = 0; i < args.length; i++) {
            if (i > 0) {
                builder.append(", ");
            }

            String paramName = resolveParameterName(parameters, i);
            Object arg = args[i];
            String sanitizedValue = sanitizeValue(paramName, arg);
            builder.append(paramName).append("=").append(sanitizedValue);
        }

        builder.append("]");
        return builder.toString();
    }

    private String resolveParameterName(Parameter[] parameters, int index) {
        if (parameters != null && index < parameters.length) {
            return parameters[index].getName();
        }
        return "arg" + index;
    }

    private String sanitizeValue(String fieldName, Object value) {
        if (value == null) {
            return "null";
        }

        if (isSensitiveName(fieldName)) {
            return MASKED;
        }

        if (value instanceof MultipartFile multipartFile) {
            return "MultipartFile{name='" + safeString(multipartFile.getOriginalFilename()) + "', size=" + multipartFile.getSize() + "}";
        }

        if (value instanceof byte[] bytes) {
            return "byte[length=" + bytes.length + "]";
        }

        if (value.getClass().isArray()) {
            return summarizeArray(value);
        }

        if (value instanceof Collection<?> collection) {
            return summarizeCollection(collection);
        }

        if (value instanceof Map<?, ?> map) {
            return summarizeMap(map);
        }

        if (value instanceof String text) {
            if (isSensitiveTextContent(fieldName, text)) {
                return REDACTED;
            }
            return "\"" + truncate(text) + "\"";
        }

        String stringValue = safeString(value.toString());
        if (isSensitiveTextContent(fieldName, stringValue)) {
            return REDACTED;
        }

        return truncate(stringValue);
    }

    private String summarizeReturnValue(Object result) {
        if (result == null) {
            return "null";
        }

        if (result instanceof Collection<?> collection) {
            return "Collection{type=" + result.getClass().getSimpleName() + ", size=" + collection.size() + "}";
        }

        if (result instanceof Map<?, ?> map) {
            return "Map{type=" + result.getClass().getSimpleName() + ", size=" + map.size() + "}";
        }

        if (result.getClass().isArray()) {
            return summarizeArray(result);
        }

        if (result instanceof String text) {
            return "String{length=" + text.length() + ", value=\"" + truncate(text) + "\"}";
        }

        String typeName = result.getClass().getSimpleName();
        String value = truncate(safeString(result.toString()));
        return typeName + "{" + value + "}";
    }

    private String summarizeCollection(Collection<?> collection) {
        String typeName = collection.getClass().getSimpleName();
        int size = collection.size();

        if (size == 0) {
            return "Collection{type=" + typeName + ", size=0}";
        }

        StringBuilder preview = new StringBuilder();
        int count = 0;
        for (Object item : collection) {
            if (count >= MAX_COLLECTION_PREVIEW) {
                break;
            }
            if (count > 0) {
                preview.append(", ");
            }
            preview.append(sanitizeValue("collectionItem", item));
            count++;
        }

        return "Collection{type=" + typeName + ", size=" + size + ", preview=[" + preview + "]}";
    }

    private String summarizeMap(Map<?, ?> map) {
        String typeName = map.getClass().getSimpleName();
        return "Map{type=" + typeName + ", size=" + map.size() + "}";
    }

    private String summarizeArray(Object array) {
        int length = Array.getLength(array);
        Class<?> componentType = array.getClass().getComponentType();
        String typeName = componentType != null ? componentType.getSimpleName() : "Unknown";
        return "Array{type=" + typeName + ", length=" + length + "}";
    }

    private boolean isSensitiveName(String fieldName) {
        String normalized = safeString(fieldName).toLowerCase(Locale.ROOT);
        return normalized.contains("password")
            || normalized.contains("pin")
            || normalized.contains("token")
            || normalized.contains("secret")
            || normalized.contains("authorization")
            || normalized.equals("nic")
            || normalized.contains("customernic")
            || normalized.contains("address")
            || normalized.contains("phone")
            || normalized.contains("email")
            || normalized.contains("image")
            || normalized.contains("base64");
    }

    private boolean isSensitiveTextContent(String fieldName, String value) {
        if (isSensitiveName(fieldName)) {
            return true;
        }

        if (value == null || value.isBlank()) {
            return false;
        }

        String trimmed = value.trim();
        if (trimmed.length() > 1000 && BASE64_PATTERN.matcher(trimmed).matches()) {
            return true;
        }

        String lowercase = trimmed.toLowerCase(Locale.ROOT);
        return lowercase.startsWith("bearer ")
            || lowercase.startsWith("basic ")
            || lowercase.contains("token")
            || lowercase.contains("password")
            || lowercase.contains("secret");
    }

    private String truncate(String value) {
        String safe = safeString(value);
        if (safe.length() <= MAX_STRING_LENGTH) {
            return safe;
        }
        return safe.substring(0, MAX_STRING_LENGTH) + "...";
    }

    private String safeString(String value) {
        if (value == null) {
            return "null";
        }
        return value.replaceAll("[\\r\\n\\t]+", " ").trim();
    }
}
