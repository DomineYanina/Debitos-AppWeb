package com.debitos.backend.service;

import com.debitos.backend.dto.NotificacionDTO;
import com.debitos.backend.model.Notificacion;
import com.debitos.backend.repository.NotificacionLecturaRepository;
import com.debitos.backend.repository.NotificacionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Autowired(required = false)
    private NotificacionLecturaRepository notificacionLecturaRepository;

    public List<NotificacionDTO> obtenerNotificacionesParaRol(String rol) {
        return obtenerNotificacionesParaRol(rol, null);
    }

    public List<NotificacionDTO> obtenerNotificacionesParaRol(String rol, String usuario) {
        String rolBuscado = (rol != null && !rol.isBlank()) ? rol.toUpperCase() : "ADMIN";
        List<String> roles;
        if ("ADMIN".equals(rolBuscado)) {
            roles = List.of("ADMIN", "OPERADOR_CONTADURIA", "TODOS");
        } else if ("OPERADOR_CONTADURIA".equals(rolBuscado)) {
            roles = List.of("OPERADOR_CONTADURIA", "TODOS");
        } else {
            roles = List.of(rolBuscado, "TODOS");
        }

        List<Notificacion> notificaciones = notificacionRepository.findTop50ByRolDestinoIn(roles);
        List<NotificacionDTO> dtos = new ArrayList<>();

        Set<Long> leidasIds = Collections.emptySet();
        if (usuario != null && !usuario.isBlank() && notificacionLecturaRepository != null && !notificaciones.isEmpty()) {
            List<Long> notifIds = notificaciones.stream().map(Notificacion::getId).toList();
            leidasIds = notificacionLecturaRepository.findLeidasIdsByUsuarioAndNotificacionIdIn(usuario.trim(), notifIds);
        }

        for (Notificacion n : notificaciones) {
            boolean leida;
            if (usuario != null && !usuario.isBlank()) {
                leida = leidasIds != null && leidasIds.contains(n.getId());
            } else {
                leida = n.getLeida() != null ? n.getLeida() : false;
            }
            dtos.add(mapearADTO(n, leida));
        }

        return dtos;
    }

    public void registrarNotificacionIngresoManual(String usuario, String tipoDoc, String letraDoc, Integer ptovta, Integer numero, String detalle) {
        try {
            String usuarioOrigen = (usuario != null && !usuario.isBlank()) ? usuario : "Operador";
            String tipo = (tipoDoc != null && !tipoDoc.isBlank()) ? tipoDoc.toUpperCase() : "NC";
            String letra = (letraDoc != null && !letraDoc.isBlank()) ? letraDoc.toUpperCase() : "B";
            int pv = ptovta != null ? ptovta : 0;
            int num = numero != null ? numero : 0;

            String docRef = String.format("%s %s-%04d-%08d", tipo, letra, pv, num);
            String titulo = String.format("Nuevo ingreso manual de %s", tipo);
            String mensaje = String.format("El operador %s registró manualmente el comprobante %s", usuarioOrigen, docRef);
            String tipoNotif = "INGRESO_MANUAL_" + tipo;

            Notificacion notif = new Notificacion(
                    tipoNotif,
                    titulo,
                    mensaje,
                    "ADMIN",
                    usuarioOrigen,
                    tipo,
                    letra,
                    pv,
                    num
            );

            notificacionRepository.save(notif);
            log.info("Notificación de ingreso manual registrada exitosamente para {}: ID {}", docRef, notif.getId());
        } catch (Exception e) {
            log.error("Error al registrar notificación en base de datos: {}", e.getMessage(), e);
        }
    }

    public void registrarNotificacionDocumentoNoEncontrado(String usuario, String tipoDoc, String letraDoc, Integer ptovta, Integer numero, String detalle) {
        try {
            String usuarioOrigen = (usuario != null && !usuario.isBlank()) ? usuario : "Operador";
            String tipo = (tipoDoc != null && !tipoDoc.isBlank()) ? tipoDoc.toUpperCase() : "FC";
            String letra = (letraDoc != null && !letraDoc.isBlank()) ? letraDoc.toUpperCase() : "A";
            int pv = ptovta != null ? ptovta : 0;
            int num = numero != null ? numero : 0;

            String docRef = String.format("%s %s-%04d-%08d", tipo, letra, pv, num);
            String titulo = String.format("Documento no encontrado: %s", docRef);
            String mensaje = String.format("El operador %s reportó que el comprobante %s no se encuentra en la base de datos.", usuarioOrigen, docRef);
            String tipoNotif = "DOC_NO_ENCONTRADO";

            Notificacion notif = new Notificacion(
                    tipoNotif,
                    titulo,
                    mensaje,
                    "ADMIN",
                    usuarioOrigen,
                    tipo,
                    letra,
                    pv,
                    num
            );

            notificacionRepository.save(notif);
            log.info("Notificación de documento no encontrado registrada para {}: ID {}", docRef, notif.getId());
        } catch (Exception e) {
            log.error("Error al registrar notificación de documento no encontrado: {}", e.getMessage(), e);
        }
    }

    public void registrarSolicitudAnulacion(String usuario, String tipoDoc, String letraDoc, Integer ptovta, Integer numero, String motivo) {
        try {
            String usuarioOrigen = (usuario != null && !usuario.isBlank()) ? usuario : "Operador";
            String tipo = (tipoDoc != null && !tipoDoc.isBlank()) ? tipoDoc.toUpperCase() : "FC";
            String letra = (letraDoc != null && !letraDoc.isBlank()) ? letraDoc.toUpperCase() : "A";
            int pv = ptovta != null ? ptovta : 0;
            int num = numero != null ? numero : 0;

            String docRef = String.format("%s %s-%04d-%08d", tipo, letra, pv, num);
            String titulo = String.format("Solicitud de Anulación: %s", docRef);
            String detalleMotivo = (motivo != null && !motivo.isBlank()) ? " Motivo: " + motivo.trim() : "";
            String mensaje = String.format("El usuario %s solicitó la anulación del comprobante %s.%s", usuarioOrigen, docRef, detalleMotivo);

            Notificacion notif = new Notificacion(
                    "SOLICITUD_ANULACION_DOCUMENTO",
                    titulo,
                    mensaje,
                    "OPERADOR_CONTADURIA",
                    usuarioOrigen,
                    tipo,
                    letra,
                    pv,
                    num
            );

            notificacionRepository.save(notif);
            log.info("Notificación de solicitud de anulación registrada para {}: ID {}", docRef, notif.getId());
        } catch (Exception e) {
            log.error("Error al registrar notificación de solicitud de anulación: {}", e.getMessage(), e);
        }
    }

    public List<Notificacion> obtenerSolicitudesAnulacion() {
        try {
            if (notificacionRepository != null) {
                return notificacionRepository.findSolicitudesAnulacion();
            }
        } catch (Exception e) {
            log.error("Error al obtener solicitudes de anulación: {}", e.getMessage(), e);
        }
        return Collections.emptyList();
    }

    public Optional<Notificacion> buscarSolicitudAnulacionActiva(String tipoDoc, String letraDoc, Integer ptovta, Integer numero) {
        if (notificacionRepository == null || letraDoc == null || ptovta == null || numero == null) {
            return Optional.empty();
        }
        try {
            String tipoBuscado = tipoDoc != null ? tipoDoc.trim().toUpperCase() : "";
            String tipoBaseBuscado = resolverTipoBase(tipoBuscado);
            List<Notificacion> lista = notificacionRepository.findSolicitudesAnulacionPorDocumento(letraDoc.trim().toUpperCase(), ptovta, numero);
            return lista.stream().filter(n -> {
                String t = n.getTipoDoc() != null ? n.getTipoDoc().trim().toUpperCase() : "";
                return t.equalsIgnoreCase(tipoBuscado) || resolverTipoBase(t).equalsIgnoreCase(tipoBaseBuscado);
            }).findFirst();
        } catch (Exception e) {
            log.warn("Error al buscar solicitud de anulación activa para {} {}-{}-{}: {}", tipoDoc, letraDoc, ptovta, numero, e.getMessage());
            return Optional.empty();
        }
    }

    @Transactional
    public void cancelarSolicitudAnulacion(String tipoDoc, String letraDoc, Integer ptovta, Integer numero, String usuario) {
        if (notificacionRepository == null) return;
        try {
            String letra = letraDoc != null ? letraDoc.trim().toUpperCase() : "";
            int pv = ptovta != null ? ptovta : 0;
            int num = numero != null ? numero : 0;
            String tipoBuscado = tipoDoc != null ? tipoDoc.trim().toUpperCase() : "";
            String tipoBase = resolverTipoBase(tipoBuscado);

            List<Notificacion> lista = notificacionRepository.findSolicitudesAnulacionPorDocumento(letra, pv, num);
            List<Notificacion> aEliminar = lista.stream().filter(n -> {
                String t = n.getTipoDoc() != null ? n.getTipoDoc().trim().toUpperCase() : "";
                return t.equalsIgnoreCase(tipoBuscado) || resolverTipoBase(t).equalsIgnoreCase(tipoBase);
            }).toList();

            if (!aEliminar.isEmpty()) {
                notificacionRepository.deleteAll(aEliminar);
                log.info("Usuario {} canceló {} solicitud(es) de anulación para {} {}-{}-{}", usuario, aEliminar.size(), tipoBuscado, letra, pv, num);
            }
        } catch (Exception e) {
            log.error("Error al cancelar solicitud de anulación: {}", e.getMessage(), e);
            throw new RuntimeException("No se pudo cancelar la solicitud de anulación: " + e.getMessage());
        }
    }

    @Transactional
    public void rechazarSolicitudAnulacion(Long idNotificacion, String tipoDoc, String letraDoc, Integer ptovta, Integer numero, String motivoRechazo, String usuario) {
        if (notificacionRepository == null) return;
        try {
            List<Notificacion> candidatos = new ArrayList<>();
            if (idNotificacion != null) {
                notificacionRepository.findById(idNotificacion).ifPresent(candidatos::add);
            }
            if (candidatos.isEmpty() && letraDoc != null && ptovta != null && numero != null) {
                String letra = letraDoc.trim().toUpperCase();
                String tipoBuscado = tipoDoc != null ? tipoDoc.trim().toUpperCase() : "";
                String tipoBase = resolverTipoBase(tipoBuscado);
                List<Notificacion> lista = notificacionRepository.findSolicitudesAnulacionPorDocumento(letra, ptovta, numero);
                candidatos.addAll(lista.stream().filter(n -> {
                    String t = n.getTipoDoc() != null ? n.getTipoDoc().trim().toUpperCase() : "";
                    return t.equalsIgnoreCase(tipoBuscado) || resolverTipoBase(t).equalsIgnoreCase(tipoBase);
                }).toList());
            }

            String solicitanteOriginal = "Operador";
            String tipoEfectivo = (tipoDoc != null && !tipoDoc.isBlank()) ? tipoDoc.toUpperCase() : "DOC";
            String letraEfectiva = (letraDoc != null && !letraDoc.isBlank()) ? letraDoc.toUpperCase() : "A";
            int pvEfectivo = ptovta != null ? ptovta : 0;
            int numEfectivo = numero != null ? numero : 0;

            if (!candidatos.isEmpty()) {
                Notificacion principal = candidatos.get(0);
                if (principal.getUsuarioOrigen() != null && !principal.getUsuarioOrigen().isBlank()) {
                    solicitanteOriginal = principal.getUsuarioOrigen();
                }
                if (principal.getTipoDoc() != null) tipoEfectivo = principal.getTipoDoc();
                if (principal.getLetraDoc() != null) letraEfectiva = principal.getLetraDoc();
                if (principal.getPtoVta() != null) pvEfectivo = principal.getPtoVta();
                if (principal.getNumero() != null) numEfectivo = principal.getNumero();

                notificacionRepository.deleteAll(candidatos);
            }

            // Generar notificación de rechazo para el operador solicitante
            String usuarioGestor = (usuario != null && !usuario.isBlank()) ? usuario : "Contaduría";
            String docRef = String.format("%s %s-%04d-%08d", tipoEfectivo, letraEfectiva, pvEfectivo, numEfectivo);
            String titulo = String.format("Solicitud de Anulación Rechazada: %s", docRef);
            String detalleMotivo = (motivoRechazo != null && !motivoRechazo.isBlank()) ? " Motivo: " + motivoRechazo.trim() : "";
            String mensaje = String.format("El usuario %s (Contaduría) rechazó la solicitud de anulación de %s.%s", usuarioGestor, docRef, detalleMotivo);

            Notificacion notifRechazo = new Notificacion(
                    "SOLICITUD_ANULACION_RECHAZADA",
                    titulo,
                    mensaje,
                    "OPERADOR",
                    usuarioGestor,
                    tipoEfectivo,
                    letraEfectiva,
                    pvEfectivo,
                    numEfectivo
            );
            notificacionRepository.save(notifRechazo);
            log.info("Solicitud de anulación rechazada para {} por {}. Notificación enviada a OPERADOR.", docRef, usuarioGestor);
        } catch (Exception e) {
            log.error("Error al rechazar solicitud de anulación: {}", e.getMessage(), e);
            throw new RuntimeException("No se pudo rechazar la solicitud de anulación: " + e.getMessage());
        }
    }

    @Transactional
    public void eliminarSolicitudesAnulacionParaDocumento(String tipoDoc, String letraDoc, Integer ptovta, Integer numero) {
        if (notificacionRepository == null || letraDoc == null || ptovta == null || numero == null) return;
        try {
            String letra = letraDoc.trim().toUpperCase();
            String tipoBuscado = tipoDoc != null ? tipoDoc.trim().toUpperCase() : "";
            String tipoBase = resolverTipoBase(tipoBuscado);
            List<Notificacion> lista = notificacionRepository.findSolicitudesAnulacionPorDocumento(letra, ptovta, numero);
            List<Notificacion> aEliminar = lista.stream().filter(n -> {
                String t = n.getTipoDoc() != null ? n.getTipoDoc().trim().toUpperCase() : "";
                return t.equalsIgnoreCase(tipoBuscado) || resolverTipoBase(t).equalsIgnoreCase(tipoBase);
            }).toList();
            if (!aEliminar.isEmpty()) {
                notificacionRepository.deleteAll(aEliminar);
                log.info("Eliminadas {} solicitudes de anulación tras confirmación contable para {} {}-{}-{}", aEliminar.size(), tipoBuscado, letra, ptovta, numero);
            }
        } catch (Exception e) {
            log.warn("Error al limpiar solicitudes de anulación para {} {}-{}-{}: {}", tipoDoc, letraDoc, ptovta, numero, e.getMessage());
        }
    }

    private static String resolverTipoBase(String tipo) {
        if (tipo == null || tipo.trim().isEmpty()) return "";
        String t = tipo.trim().toUpperCase();
        if (t.startsWith("FC") || t.startsWith("FAC")) return "FC";
        if (t.startsWith("NC")) return "NC";
        if (t.startsWith("ND")) return "ND";
        if (t.startsWith("RC")) return "RC";
        if (t.startsWith("OP")) return "OP";
        return t;
    }

    @Transactional
    public void marcarComoLeida(Long id) {
        marcarComoLeida(id, null);
    }

    @Transactional
    public void marcarComoLeida(Long id, String usuario) {
        if (id != null) {
            if (usuario != null && !usuario.isBlank() && notificacionLecturaRepository != null) {
                notificacionLecturaRepository.registrarLectura(id, usuario.trim());
            } else {
                notificacionRepository.marcarComoLeida(id, ZonedDateTime.now());
            }
        }
    }

    @Transactional
    public void marcarTodasComoLeidas(String rol) {
        marcarTodasComoLeidas(rol, null);
    }

    @Transactional
    public void marcarTodasComoLeidas(String rol, String usuario) {
        String rolBuscado = (rol != null && !rol.isBlank()) ? rol.toUpperCase() : "ADMIN";
        List<String> roles;
        if ("ADMIN".equals(rolBuscado)) {
            roles = List.of("ADMIN", "OPERADOR_CONTADURIA", "TODOS");
        } else if ("OPERADOR_CONTADURIA".equals(rolBuscado)) {
            roles = List.of("OPERADOR_CONTADURIA", "TODOS");
        } else {
            roles = List.of(rolBuscado, "TODOS");
        }

        if (usuario != null && !usuario.isBlank() && notificacionLecturaRepository != null) {
            notificacionLecturaRepository.registrarLecturaMasiva(roles, usuario.trim());
        } else {
            notificacionRepository.marcarTodasComoLeidas(roles, ZonedDateTime.now());
        }
    }

    private NotificacionDTO mapearADTO(Notificacion n) {
        return mapearADTO(n, n.getLeida() != null ? n.getLeida() : false);
    }

    private NotificacionDTO mapearADTO(Notificacion n, boolean leida) {
        String docCompleto = String.format("%s %s-%04d-%08d",
                n.getTipoDoc() != null ? n.getTipoDoc() : "NC",
                n.getLetraDoc() != null ? n.getLetraDoc() : "B",
                n.getPtoVta() != null ? n.getPtoVta() : 0,
                n.getNumero() != null ? n.getNumero() : 0);

        return new NotificacionDTO(
                n.getId(),
                n.getTipoNotificacion(),
                n.getTitulo(),
                n.getMensaje(),
                n.getUsuarioOrigen(),
                n.getFechaCreacion(),
                docCompleto,
                n.getTipoDoc(),
                n.getLetraDoc(),
                n.getPtoVta(),
                n.getNumero(),
                n.getTipoNotificacion(),
                leida
        );
    }
}
