### **Documentación Técnica - Sistema de Soporte Alfred Smart**

#### **1. Introducción**

El presente documento describe la arquitectura, tecnologías y funcionamiento del **Sistema de Soporte Alfred Smart**. Se trata de una aplicación web progresiva (PWA) diseñada para centralizar, gestionar y dar seguimiento a las incidencias y solicitudes técnicas reportadas por los usuarios. El sistema utiliza una arquitectura moderna serverless para garantizar alta disponibilidad, escalabilidad y bajo mantenimiento.

#### **2. Arquitectura General**

El sistema se compone de tres capas principales que interactúan entre sí:

1.  **Frontend (Capa de Presentación):** La interfaz de usuario visible y con la que interactúa el cliente. Está construida con tecnologías web estándar y alojada en Netlify.
2.  **Backend (Capa de Lógica):** Un conjunto de funciones serverless que se ejecutan en la nube (Netlify Functions). Se encargan de procesar los datos, interactuar con servicios externos y ejecutar la lógica de negocio sin necesidad de un servidor dedicado.
3.  **Servicios Externos (Capa de Datos y Comunicación):** Plataformas de terceros integradas para la persistencia de datos (Google Sheets), almacenamiento de archivos (Cloudinary) y comunicación por correo electrónico (Gmail API).

```
[Usuario] --> [Frontend en Netlify] --> [Backend (Netlify Functions)] --> [Google Sheets, Cloudinary, Gmail]
```

#### **3. Tecnologías y Herramientas Utilizadas**

##### **Frontend**
*   **HTML5:** Para la estructura semántica de las páginas.
*   **CSS3:** Para el diseño visual, complementado con **Bootstrap 5** para crear una interfaz responsiva, moderna y profesional con componentes pre-diseñados.
*   **JavaScript (ES6+):** Para la lógica del lado del cliente, incluyendo la validación de formularios, la gestión de la UI y las peticiones asíncronas (API calls) al backend.

##### **Backend**
*   **Node.js:** Entorno de ejecución de JavaScript en el servidor sobre el que corren las funciones de Netlify.
*   **Netlify Functions:** Plataforma serverless que permite desplegar código backend (Node.js) en respuesta a eventos HTTP, sin gestionar servidores.
*   **Dependencias Clave (npm):**
    *   `formidable`: Para parsear datos de formularios `multipart/form-data`, incluyendo la subida de archivos.
    *   `google-spreadsheet`: Librería para interactuar con la API de Google Sheets de forma sencilla.
    *   `nodemailer`: El estándar de facto para enviar correos electrónicos desde aplicaciones Node.js.
    *   `cloudinary`: SDK oficial para interactuar con la API de Cloudinary y subir archivos.

##### **Base de Datos y Almacenamiento**
*   **Google Sheets:** Utilizado como base de datos principal. Su naturaleza de hoja de cálculo lo hace ideal para que el equipo de soporte pueda ver, gestionar y exportar los tickets fácilmente.
*   **API de Google Cloud:** Se utiliza una cuenta de servicio para autenticar y autorizar las operaciones de lectura/escritura en Google Sheets de forma programática y segura.
*   **Cloudinary:** Servicio de almacenamiento en la nube para las imágenes y videos que los usuarios adjuntan a sus reportes. Proporciona URLs públicas optimizadas para los archivos.

##### **Control de Versiones y Despliegue**
*   **GitHub:** Repositorio central para el código fuente, permitiendo control de versiones y colaboración.
*   **Netlify:** Plataforma de despliegue continuo. Cada `push` a la rama `main` de GitHub activa automáticamente un nuevo despliegue de la aplicación (tanto el frontend como las funciones).

#### **4. Flujo de Funcionamiento (Creación de un Ticket)**

El proceso de creación de un nuevo ticket sigue los siguientes pasos:

1.  **Interacción del Usuario:** El usuario completa el formulario de reporte de incidencias en la página `index.html`, incluyendo datos de contacto, detalles del problema y, opcionalmente, archivos adjuntos.
2.  **Captura de Datos (Frontend):** El JavaScript (`main.js`) captura el evento `submit` del formulario. Previene el comportamiento por defecto (recarga de la página) y crea un objeto `FormData` que contiene todos los campos del formulario y los archivos.
3.  **Petición al Backend:** El frontend realiza una petición `POST` a la URL de la función serverless: `/.netlify/functions/submit-ticket`, enviando el objeto `FormData` en el cuerpo de la petición.
4.  **Ejecución de la Función (Backend):**
    a. Netlify recibe la petición y ejecuta la función `submit-ticket.js`.
    b. La librería `formidable` parsea los datos de la petición, separando los campos de texto de los archivos.
    c. Si existen archivos adjuntos, la función los sube a Cloudinary uno por uno, obteniendo una URL pública para cada uno.
    d. La función se autentica con la API de Google Sheets utilizando las credenciales de la cuenta de servicio.
    e. Se crea una nueva fila en la hoja de cálculo con todos los datos del ticket: ID único, fecha, email, descripción, URLs de los adjuntos, estado inicial "Pendiente", etc.
    f. La función utiliza `nodemailer` para conectarse a la cuenta de Gmail y enviar un correo de confirmación al usuario con su número de ticket.
5.  **Respuesta al Frontend:** La función devuelve una respuesta JSON con un mensaje de éxito y el `ticketId` generado.
6.  **Confirmación Visual:** El JavaScript del frontend recibe la respuesta y actualiza la interfaz para mostrar un mensaje de éxito al usuario, junto con su número de ticket.

#### **5. Flujo de Funcionamiento (Consulta de Estado)**

1.  El usuario navega a la página `dashboard.html` e introduce su email y número de ticket.
2.  El JavaScript (`dashboard.js`) realiza una petición `GET` a la función `/.netlify/functions/check-status`, pasando el email y el ticket como parámetros en la URL.
3.  La función `check-status.js` se conecta a Google Sheets, busca la fila que coincida con ambos datos y devuelve la información del ticket (estado, notas, etc.) en formato JSON.
4.  El frontend recibe los datos y los muestra de forma clara y estructurada al usuario.

#### **6. Ventajas de esta Arquitectura**

*   **Costo-Efectiva:** Las tecnologías utilizadas (Netlify, Google Sheets, Cloudinary) tienen generosos planes gratuitos que cubren las necesidades del proyecto.
*   **Alta Disponibilidad y Escalabilidad:** Al ser serverless, la infraestructura se escala automáticamente según la demanda, sin intervención manual.
*   **Bajo Mantenimiento:** No hay servidores que administrar, parchear o actualizar. Netlify y Google se encargan de la infraestructura.
*   **Seguridad:** Las credenciales sensibles (claves de API, contraseñas) nunca se exponen en el código. Se almacenan de forma segura como variables de entorno en Netlify.
*   **Desarrollo Rápido:** El flujo de trabajo de GitHub -> Netlify permite desplegar cambios en minutos.

#### **7. Conclusión**

El Sistema de Soporte Alfred Smart es una solución robusta, moderna y eficiente que demuestra cómo es posible construir aplicaciones completas y funcionales combinando tecnologías frontend y backend serverless. El resultado es una herramienta poderosa para la gestión de incidencias que mejora tanto la experiencia del usuario como la eficiencia del equipo de soporte.
