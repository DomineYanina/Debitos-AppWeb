package com.debitos.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

@Entity
@Table(name = "notadedebito")
public class NotaDeDebito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Relación con la prestación original
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_prestacion")
    private AmbLiquidado prestacion;

    // Relación: La NC original que originó este rechazo/refacturación
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_notadecredito")
    private NotaDeCredito notaDeCreditoPadre;

    private String tipo;

    @Column(length = 1)
    private String letra;

    private Integer ptovta;
    private Integer numero;
    private LocalDate fecha;

    // Datos de refacturación
    private String motivorefactura;
    private BigDecimal importerefactura;
    private String prestacionenglobante;
    private String codigo;
    private Integer diasfacturados;

    private String comentarios;

    @Column(name = "comentarios_debito")
    private String comentariosDebito;

    private String usuario;
    private String tiporegistro;
    private Boolean cargadocompletamente;
    private Boolean cargarcompletamente;

    @Column(name = "fecha_registro")
    private ZonedDateTime fechaRegistro;

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

    public NotaDeCredito getNotaDeCreditoPadre() {
        return notaDeCreditoPadre;
    }

    public void setNotaDeCreditoPadre(NotaDeCredito notaDeCreditoPadre) {
        this.notaDeCreditoPadre = notaDeCreditoPadre;
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

    public String getMotivorefactura() {
        return motivorefactura;
    }

    public void setMotivorefactura(String motivorefactura) {
        this.motivorefactura = motivorefactura;
    }

    public BigDecimal getImporterefactura() {
        return importerefactura;
    }

    public void setImporterefactura(BigDecimal importerefactura) {
        this.importerefactura = importerefactura;
    }

    public String getPrestacionenglobante() {
        return prestacionenglobante;
    }

    public void setPrestacionenglobante(String prestacionenglobante) {
        this.prestacionenglobante = prestacionenglobante;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public Integer getDiasfacturados() {
        return diasfacturados;
    }

    public void setDiasfacturados(Integer diasfacturados) {
        this.diasfacturados = diasfacturados;
    }

    public String getComentarios() {
        return comentarios;
    }

    public void setComentarios(String comentarios) {
        this.comentarios = comentarios;
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

    public Boolean getCargarcompletamente() {
        return cargarcompletamente;
    }

    public void setCargarcompletamente(Boolean cargarcompletamente) {
        this.cargarcompletamente = cargarcompletamente;
    }

    @PrePersist
    @PreUpdate
    public void actualizarFechaRegistro() {
        this.fechaRegistro = ZonedDateTime.now();
    }

    public ZonedDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(ZonedDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}