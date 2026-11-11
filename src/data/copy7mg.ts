/**
 * 7M-G §5: textos definitivos de la familia Ecología (orden de restauración
 * 7M-G). Viven fuera de copy7mf.ts (generado) para no mezclar fuentes.
 */
export const ECOLOGIA_FAMILY = {
  id: 'ecologia',
  label: 'Tecnología y sostenibilidad',
  mode: 'Asistido',
  steps: [
    { title: 'Recursos', body: 'Identifica los materiales, la energía y los equipos que utiliza tu operación.' },
    { title: 'Opciones', body: 'Revisa oportunidades de mantenimiento, reutilización y mejor aprovechamiento.' },
    { title: 'Aplicación', body: 'Define cambios concretos y las personas responsables de realizarlos.' },
    { title: 'Seguimiento', body: 'Registra lo que cambió y contrástalo con los datos disponibles.' },
  ],
  result: 'Un equipo documenta el mantenimiento y la reutilización de sus dispositivos antes de decidir qué necesita reemplazar.',
} as const;
