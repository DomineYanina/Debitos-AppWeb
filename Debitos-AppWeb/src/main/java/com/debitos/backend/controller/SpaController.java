package com.debitos.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = {
        "/",
        "/login",
        "/auditoria",
        "/directorio",
        "/directorio/**",
        "/{path:[^\\.]*}"
    })
    public String forwardSpa() {
        return "forward:/index.html";
    }
}
