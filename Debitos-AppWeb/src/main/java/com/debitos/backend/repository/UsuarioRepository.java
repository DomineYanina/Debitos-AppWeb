package com.debitos.backend.repository;

import com.debitos.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsuario(String username);

    @Query("SELECT DISTINCT UPPER(TRIM(u.rol)) FROM Usuario u WHERE u.rol IS NOT NULL AND TRIM(u.rol) <> '' AND UPPER(TRIM(u.rol)) <> 'ADMIN' ORDER BY UPPER(TRIM(u.rol)) ASC")
    List<String> findDistinctRolesNoAdmin();
}
