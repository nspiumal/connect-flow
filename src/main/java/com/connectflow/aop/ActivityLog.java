package com.connectflow.aop;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Place on a controller method to automatically persist a record to the
 * activity_log table when that endpoint is invoked.
 *
 * Example:
 *   @ActivityLog(action = "CREATE_PAWN_TRANSACTION", description = "Created new pawn transaction")
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ActivityLog {

    /** Short uppercase identifier, e.g. "CREATE_PAWN_TRANSACTION" */
    String action();

    /** Human-readable description stored in the log record */
    String description() default "";
}

