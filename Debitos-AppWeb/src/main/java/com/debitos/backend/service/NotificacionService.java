package com.debitos.backend.service;

import com.debitos.backend.dto.NotificacionDTO;
import com.debitos.backend.model.Notificacion;
import com.debitos.backend.repository.NotificacionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);

    @Autowired
    private NotificacionRepository notificacionRepository;

    public List<NotificacionDTO> obtenerNotificacionesParaRol(String rol) {
        String rolBuscado = (rol != null && !rol.isBlank()) ? rol.toUpperCase() : "ADMIN";
        List<String> roles = List.of(rolBuscado, "TODOS");

        List<Notificacion> notificaciones = notificacionRepository.findTop50ByRolDestinoIn(roles);
        List<NotificacionDTO> dtos = new ArrayList<>();


        for (Notificacion n : notificaciones) {
            dtos.add(mapearADTO(n));
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

    @Transactional
    public void marcarComoLeida(Long id) {
        if (id != null) {
            notificacionRepository.marcarComoLeida(id, ZonedDateTime.now());
        }
    }

    @Transactional
    public void marcarTodasComoLeidas(String rol) {
        String rolBuscado = (rol != null && !rol.isBlank()) ? rol.toUpperCase() : "ADMIN";
        List<String> roles = List.of(rolBuscado, "TODOS");
        notificacionRepository.marcarTodasComoLeidas(roles, ZonedDateTime.now());
    }

    private NotificacionDTO mapearADTO(Notificacion n) {
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
                n.getLeida() != null ? n.getLeida() : false
        );
    }
}
