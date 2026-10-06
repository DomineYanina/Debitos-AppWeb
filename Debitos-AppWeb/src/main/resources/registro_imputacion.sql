-- =============================================================================
-- Script de Creación de Tabla de Auditoría de Imputaciones
-- Motor: PostgreSQL
-- Aplicación: Debitos-AppWeb
-- =============================================================================

CREATE TABLE IF NOT EXISTS registro_imputacion (
    id BIGSERIAL PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_cabecera_origen BIGINT NOT NULL,
    id_cabecera_destino BIGINT NOT NULL,
    tipo_imputacion VARCHAR(100) NOT NULL,
    origen_cabecera VARCHAR(20),
    comprobante_origen VARCHAR(50),
    comprobante_destino VARCHAR(50)
);

-- Índices para optimizar búsquedas por comprobantes y auditoría temporal
CREATE INDEX IF NOT EXISTS idx_registro_imputacion_origen ON registro_imputacion(id_cabecera_origen);
CREATE INDEX IF NOT EXISTS idx_registro_imputacion_destino ON registro_imputacion(id_cabecera_destino);
CREATE INDEX IF NOT EXISTS idx_registro_imputacion_fecha ON registro_imputacion(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_registro_imputacion_usuario ON registro_imputacion(usuario);

COMMENT ON TABLE registro_imputacion IS 'Auditoría histórica e inmutable de imputaciones a Notas de Crédito y Notas de Débito';
COMMENT ON COLUMN registro_imputacion.usuario IS 'Usuario/Auditor que ejecutó la imputación';
COMMENT ON COLUMN registro_imputacion.fecha_hora IS 'Fecha y hora exacta en la que se efectivizó la imputación';
COMMENT ON COLUMN registro_imputacion.id_cabecera_origen IS 'ID de la Cabecera del documento auditado/origen (FC, NC, ND)';
COMMENT ON COLUMN registro_imputacion.id_cabecera_destino IS 'ID de la Cabecera del documento generado/guardado (NC, ND)';
COMMENT ON COLUMN registro_imputacion.tipo_imputacion IS 'Tipo de imputación: NC, ND, NC_AJUSTE_IVA, ND_AJUSTE_IVA, Agregado de prestaciones a imputación, Modificación de prestaciones ya imputadas';
COMMENT ON COLUMN registro_imputacion.origen_cabecera IS 'EXISTENTE o APP_MANUAL';
COMMENT ON COLUMN registro_imputacion.comprobante_origen IS 'Referencia humana del origen, ej: FC A-0001-00012345';
COMMENT ON COLUMN registro_imputacion.comprobante_destino IS 'Referencia humana del comprobante guardado, ej: NC A-0001-00000567';

-- Migración para tablas ya creadas previamente con longitud VARCHAR(30):
ALTER TABLE registro_imputacion ALTER COLUMN tipo_imputacion TYPE VARCHAR(100);


