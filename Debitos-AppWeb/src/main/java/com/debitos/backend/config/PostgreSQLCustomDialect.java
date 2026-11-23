package com.debitos.backend.config;

import org.hibernate.dialect.DatabaseVersion;
import org.hibernate.dialect.PostgreSQLDialect;
import org.hibernate.dialect.pagination.LimitHandler;
import org.hibernate.dialect.pagination.LimitOffsetLimitHandler;
import org.hibernate.engine.jdbc.dialect.spi.DialectResolutionInfo;
import org.hibernate.query.common.FetchClauseType;

/**
 * Dialecto personalizado para PostgreSQL compatible con versiones legacy (ej. PostgreSQL 9.6).
 * Fuerza la generación de cláusulas estándar 'LIMIT ? OFFSET ?' en lugar de
 * 'OFFSET ? ROWS FETCH FIRST ? ROWS ONLY' (tanto en SQL AST Translator mediante
 * supportsFetchClause=false como en LimitHandler), evitando errores de sintaxis con
 * parámetros ($1/$2) en versiones de PostgreSQL anteriores a la 13.
 */
public class PostgreSQLCustomDialect extends PostgreSQLDialect {

    public PostgreSQLCustomDialect() {
        super(DatabaseVersion.make(9, 6));
    }

    public PostgreSQLCustomDialect(DialectResolutionInfo info) {
        super(info);
    }

    public PostgreSQLCustomDialect(DatabaseVersion version) {
        super(version);
    }

    @Override
    protected DatabaseVersion getMinimumSupportedVersion() {
        return DatabaseVersion.make(9, 6);
    }

    @Override
    public LimitHandler getLimitHandler() {
        return LimitOffsetLimitHandler.INSTANCE;
    }

    @Override
    public boolean supportsFetchClause(FetchClauseType type) {
        return false;
    }
}
