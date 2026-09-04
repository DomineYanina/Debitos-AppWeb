package com.debitos.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "notadedebito")
public class NotaDeDebito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idcabecera")
    @NotFound(action = NotFoundAction.IGNORE)
    private Cabecera cabecera;

    // Relación con la prestación original
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_prestacion")
    @NotFound(action = NotFoundAction.IGNORE)
    private AmbLiquidado prestacion;

    // Relación: La NC original que originó este rechazo/refacturación
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_notadecredito")
    @NotFound(action = NotFoundAction.IGNORE)
    private NotaDeCredito notaDeCreditoPadre;

    @Column(name = "tipo_nd")
    private String tipoNd;

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
    private Boolean cargadocompletamente;
    private Boolean cargarcompletamente;

    @Column(name = "fecha_registro")
    private ZonedDateTime fechaRegistro;

    public NotaDeDebito() {}

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Cabecera getCabecera() {
        return cabecera;
    }

    public void setCabecera(Cabecera cabecera) {
        this.cabecera = cabecera;
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

    public String getTipoNd() {
        return tipoNd;
    }

    public void setTipoNd(String tipoNd) {
        this.tipoNd = tipoNd;
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