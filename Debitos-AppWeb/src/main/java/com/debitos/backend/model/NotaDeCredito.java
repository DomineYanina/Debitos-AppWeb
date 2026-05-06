package com.debitos.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

@Entity
@Table(name = "notadecredito")
public class NotaDeCredito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Relación con la prestación original
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_prestacion")
    private AmbLiquidado prestacion;

    // Relación: La ND original que originó esta NC (Caso 3)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_notadedebito")
    private NotaDeDebito notaDeDebitoPadre;

    private String tipo;

    @Column(length = 1)
    private String letra;

    private Integer ptovta;
    private Integer numero;
    private LocalDate fecha;

    private Boolean debitoaceptado;

    @Column(name = "motivodedebito")
    private String motivoDebito;

    @Column(name = "importedebitado")
    private BigDecimal importeDebitado;

    private String motivoderefactura;
    private BigDecimal importederefactura;
    private String comentarios;
    private Integer diasfacturados;
    private String prestacionenglobante;

    @Column(name = "comentarios_debito")
    private String comentariosDebito;

    private String usuario;
    private String tiporegistro;
    private Boolean cargadocompletamente;

    @Column(name = "fecha_registro")
    private ZonedDateTime fechaRegistro;

    // ==========================================
    // GETTERS Y SETTERS
    // ==========================================

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public AmbLiquidado getPrestacion() {
        return prestacion;
    }

    public void setPrestacion(AmbLiquidado prestacion) {
        this.prestacion = prestacion;
    }

    public NotaDeDebito getNotaDeDebitoPadre() {
        return notaDeDebitoPadre;
    }

    public void setNotaDeDebitoPadre(NotaDeDebito notaDeDebitoPadre) {
        this.notaDeDebitoPadre = notaDeDebitoPadre;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getLetra() {
        return letra;
    }

    public void setLetra(String letra) {
        this.letra = letra;
    }

    public Integer getPtovta() {
        return ptovta;
    }

    public void setPtovta(Integer ptovta) {
        this.ptovta = ptovta;
    }

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Boolean getDebitoaceptado() {
        return debitoaceptado;
    }

    public void setDebitoaceptado(Boolean debitoaceptado) {
        this.debitoaceptado = debitoaceptado;
    }

    public String getMotivoDebito() {
        return motivoDebito;
    }

    public void setMotivoDebito(String motivoDebito) {
        this.motivoDebito = motivoDebito;
    }

    public BigDecimal getImporteDebitado() {
        return importeDebitado;
    }

    public void setImporteDebitado(BigDecimal importeDebitado) {
        this.importeDebitado = importeDebitado;
    }

    public String getMotivoderefactura() {
        return motivoderefactura;
    }

    public void setMotivoderefactura(String motivoderefactura) {
        this.motivoderefactura = motivoderefactura;
    }

    public BigDecimal getImportederefactura() {
        return importederefactura;
    }

    public void setImportederefactura(BigDecimal importederefactura) {
        this.importederefactura = importederefactura;
    }

    public String getComentarios() {
        return comentarios;
    }

    public void setComentarios(String comentarios) {
        this.comentarios = comentarios;
    }

    public Integer getDiasfacturados() {
        return diasfacturados;
    }

    public void setDiasfacturados(Integer diasfacturados) {
        this.diasfacturados = diasfacturados;
    }

    public String getPrestacionenglobante() {
        return prestacionenglobante;
    }

    public void setPrestacionenglobante(String prestacionenglobante) {
        this.prestacionenglobante = prestacionenglobante;
    }

    public String getComentariosDebito() {
        return comentariosDebito;
    }

    public void setComentariosDebito(String comentariosDebito) {
        this.comentariosDebito = comentariosDebito;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getTiporegistro() {
        return tiporegistro;
    }

    public void setTiporegistro(String tiporegistro) {
        this.tiporegistro = tiporegistro;
    }

    public Boolean getCargadocompletamente() {
        return cargadocompletamente;
    }

    public void setCargadocompletamente(Boolean cargadocompletamente) {
        this.cargadocompletamente = cargadocompletamente;
    }

    @PrePersist
    @PreUpdate
    public void actualizarFechaRegistro() {
        this.fechaRegistro = ZonedDateTime.now();
    }

    // ... tus getters y setters habituales ...
    public ZonedDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(ZonedDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}