package com.debitos.backend.config;

import org.hibernate.dialect.DatabaseVersion;
import org.hibernate.dialect.pagination.LimitOffsetLimitHandler;
import org.hibernate.query.common.FetchClauseType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PostgreSQLCustomDialectTest {

    @Test
    @DisplayName("Debe utilizar LimitOffsetLimitHandler para compatibilidad con PostgreSQL 9.6")
    void testLimitHandler() {
        PostgreSQLCustomDialect dialect = new PostgreSQLCustomDialect();
        assertSame(LimitOffsetLimitHandler.INSTANCE, dialect.getLimitHandler());
    }

    @Test
    @DisplayName("Debe desactivar cláusulas FETCH FIRST para evitar error de sintaxis con $2 en PostgreSQL 9.6")
    void testSupportsFetchClauseDisabled() {
        PostgreSQLCustomDialect dialect = new PostgreSQLCustomDialect();
        for (FetchClauseType type : FetchClauseType.values()) {
            assertFalse(dialect.supportsFetchClause(type),
                    "supportsFetchClause debe retornar false para " + type);
        }
    }

    @Test
    @DisplayName("La versión mínima soportada debe incluir PostgreSQL 9.6")
    void testMinimumSupportedVersion() {
        PostgreSQLCustomDialect dialect = new PostgreSQLCustomDialect();
        DatabaseVersion version = dialect.getVersion();
        assertEquals(9, version.getMajor());
        assertEquals(6, version.getMinor());
    }
}
