const entityBtn = document.getElementById("entityBtn");
const cardinalityBtn = document.getElementById("cardinalityBtn");
const squareContainer = document.getElementById("squareContainer");
const attributeBtn = document.getElementById("attributeBtn");
const modal = document.getElementById("attributeModal");
cardinalityBtn.addEventListener("click", enableCardinalityMode);

let squareIdCounter = 0;
let selectedEntities = [];
let lines = [];
let isCardinalityMode = false;

function enableCardinalityMode() {
    isCardinalityMode = true;
    selectedEntities = [];
    squareContainer.addEventListener("click", selectEntity);
}

squareContainer.addEventListener("click", (e) => {
    if (isCardinalityMode) {
        selectEntity(e);
    }
});

entityBtn.addEventListener("click", createEntity);
cardinalityBtn.addEventListener("click", enableCardinalityMode);


function createEntity() {
    const newSquare = document.createElement("div");
    const squareId = "square_" + squareIdCounter++;
    newSquare.id = squareId;
    newSquare.classList.add("square");
    newSquare.innerHTML = `
        <div class="section-small">Entité</div>
        <div class="section-large"></div>
        <button class="close-btn">X</button>
    `;
    newSquare.style.position = "absolute"; // Ensure position is absolute for dragging
    newSquare.style.left = "100px"; // Initial left position
    newSquare.style.top = "100px"; // Initial top position
    squareContainer.appendChild(newSquare);

    newSquare.querySelector('.close-btn').addEventListener('click', () => removeEntity(squareId));
    newSquare.addEventListener("mousedown", startDrag);
}

function enableCardinalityMode() {
    selectedEntities = [];
    squareContainer.addEventListener("click", selectEntity);
}

function selectEntity(e) {
    const square = e.target.closest('.square');
    if (square) {
        const squareId = square.id;
        if (!selectedEntities.includes(squareId)) {
            selectedEntities.push(squareId);
            if (selectedEntities.length === 2) {
                const [entity1Id, entity2Id] = selectedEntities;
                const entity1 = document.getElementById(entity1Id);
                const entity2 = document.getElementById(entity2Id);

                // Check if a line already exists between these entities
                const existingLine = findLineBetweenEntities(entity1, entity2);
                if (existingLine) {
                    // If a line already exists, just update its position and comboboxes
                    updateLinePosition(entity1, entity2, existingLine);
                    updateComboboxPosition(entity1, entity2, existingLine.comboboxLeft, existingLine.comboboxRight);
                } else {
                    // If no line exists, draw a new line and attach comboboxes
                    const line = drawLineBetweenEntities(entity1, entity2);
                    lines.push(line);
                    showLineOptions(entity1, entity2, line);
                }

                selectedEntities = []; // Clear the selected entities array
                isCardinalityMode = false; // Disable cardinality mode after linking
                squareContainer.removeEventListener("click", selectEntity);
            }
        }
    }
}

function findLineBetweenEntities(entity1, entity2) {
    // Find the line that connects the given entities
    return lines.find(line => {
        const entityId1 = line.getAttribute("data-entity1");
        const entityId2 = line.getAttribute("data-entity2");
        return (entityId1 === entity1.id && entityId2 === entity2.id) ||
               (entityId1 === entity2.id && entityId2 === entity1.id);
    });
}

function drawLineBetweenEntities(entity1, entity2) {
    const line = document.createElement("div");
    line.classList.add("line");
    line.style.position = "absolute";
    line.style.border = "1px solid black";
    line.style.zIndex = "-1"; // Ensure the line is behind the entities

    updateLinePosition(entity1, entity2, line); // Update line position initially

    squareContainer.appendChild(line);
    return line;
}

function updateLinePosition(entity1, entity2, line) {
    const entity1Rect = entity1.getBoundingClientRect();
    const entity2Rect = entity2.getBoundingClientRect();

    const x1 = entity1Rect.left + entity1Rect.width / 2;
    const y1 = entity1Rect.top + entity1Rect.height / 2;
    const x2 = entity2Rect.left + entity2Rect.width / 2;
    const y2 = entity2Rect.top + entity2Rect.height / 2;

    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    line.style.width = length + "px";
    line.style.left = (x1 + x2) / 2 - length / 2 + "px";
    line.style.top = (y1 + y2) / 2 - 1 + "px"; // Subtract 1 to vertically center the line
    line.style.transform = "rotate(" + angle + "deg)";

    // Save entity IDs as attributes to retrieve them later
    line.setAttribute("data-entity1", entity1.id);
    line.setAttribute("data-entity2", entity2.id);

    // Update combobox positions
    updateComboboxPosition(entity1, entity2, line);

    // Update ellipse position
    updateEllipsePosition(line);
}

function startDrag(e) {
    const draggedSquare = e.target.closest('.square'); // Ensure we get the closest square
    const offsetX = e.pageX - draggedSquare.getBoundingClientRect().left;
    const offsetY = e.pageY - draggedSquare.getBoundingClientRect().top;

    function drag(e) {
        const x = e.pageX - offsetX;
        const y = e.pageY - offsetY;

        draggedSquare.style.left = x + "px";
        draggedSquare.style.top = y + "px";

        // Update lines position when dragging
        updateLinePositions();
    }

    function stopDrag() {
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", stopDrag);
    }

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDrag);

    // Add an event listener to detect double clicks
    draggedSquare.addEventListener("dblclick", () => {
        const entityModal = document.getElementById("entityModal");
        entityModal.style.display = "block";
    });
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDrag);

    draggedSquare.addEventListener("dblclick", () => {
        const entityModal = document.getElementById("entityModal");
        entityModal.style.display = "block";

        const entityName = draggedSquare.querySelector('.section-small').textContent;
        document.getElementById('entityName').value = entityName;

        const attributeElements = draggedSquare.querySelectorAll('.section-large div');
        const attributeNames = Array.from(attributeElements).map(attr => attr.textContent);
        const attributeInputs = document.querySelectorAll('.attribute-name');
        attributeInputs.forEach((input, index) => {
            input.value = attributeNames[index] || '';
        });

        const checkboxes = document.querySelectorAll('.underline-checkbox');
        checkboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', function() {
                const attributeNameElement = attributeInputs[index];
                if (this.checked) {
                    attributeNameElement.classList.add('underline');
                } else {
                    attributeNameElement.classList.remove('underline');
                }
            });
        });

        document.getElementById('okBtn').onclick = function() {
            const newEntityName = document.getElementById('entityName').value;
            const newAttributeInputs = document.querySelectorAll('.attribute-name');
            const newAttributeNames = Array.from(newAttributeInputs).map(input => input.value);

            updateEntityData(draggedSquare, newEntityName, newAttributeNames);

            const sectionLargeDivs = draggedSquare.querySelectorAll('.section-large div');
            sectionLargeDivs.forEach((div, index) => {
                if (checkboxes[index].checked) {
                    div.classList.add('underline');
                } else {
                    div.classList.remove('underline');
                }
            });

            entityModal.style.display = "none";
        };
    });
}

function updateLinePositions() {
    lines.forEach(line => {
        const entityId1 = line.getAttribute("data-entity1");
        const entityId2 = line.getAttribute("data-entity2");
        const entity1 = document.getElementById(entityId1);
        const entity2 = document.getElementById(entityId2);

        // Check if entities are null before calling updateLinePosition
        if (entity1 && entity2) {
            updateLinePosition(entity1, entity2, line);
        } else {
            // If either of the entities is null, remove the line
            line.remove();
        }
    });
}

function showLineOptions(entity1, entity2, line) {
    const comboboxLeft = document.createElement("select");
    comboboxLeft.classList.add("combobox");
    comboboxLeft.style.fontFamily = 'Arial'; // Définition de la police pour la combobox gauche
    comboboxLeft.innerHTML = `
        <option value ="0..n">0.n</option>
        <option value="0..1">0.1</option>
        <option value="1..1">1.1</option>
        <option value="1..n">1.n</option>
        `;
    
        const comboboxRight = document.createElement("select");
        comboboxRight.classList.add("combobox");
        comboboxRight.style.fontFamily = 'Arial'; // Définition de la police pour la combobox droite
        comboboxRight.innerHTML = `
            <option value="0..n">0.n</option> 
            <option value="0..1">0.1</option>
            <option value="1..1">1.1</option>
            <option value="1..n">1.n</option>
        `;
    
        squareContainer.appendChild(comboboxLeft);
        squareContainer.appendChild(comboboxRight);
    
        line.comboboxLeft = comboboxLeft;
        line.comboboxRight = comboboxRight;
    
        updateComboboxPosition(entity1, entity2, line);
    
        // Create and add the ellipse
        const ellipse = document.createElement("div");
        ellipse.classList.add("ellipse");
        ellipse.style.position = "absolute";
        ellipse.style.width = "100px"; // Width of the ellipse
        ellipse.style.height = "50px"; // Height of the ellipse
        ellipse.style.backgroundColor = "blue";
        ellipse.style.borderRadius = "50%"; // Make it an ellipse
        ellipse.style.zIndex = "1"; // Ensure the ellipse is on top of the line
    
        squareContainer.appendChild(ellipse);
        line.ellipse = ellipse;
// Add click event to the ellipse to open the modal
ellipse.addEventListener("click", () => {
    const associationModal = document.getElementById("associationModal");
    associationModal.style.display = "block";

    const saveBtn = document.getElementById("saveAssociationBtn");
    const cancelBtn = document.getElementById("cancelAssociationBtn");

    saveBtn.onclick = () => {
        const associationName = document.getElementById("associationName").value;
        ellipse.innerHTML = associationName; // Display association name in ellipse
        associationModal.style.display = "none";
    };
    
    cancelBtn.onclick = () => {
        associationModal.style.display = "none";
    };
});
}
    function updateComboboxPosition(entity1, entity2, line) {
        const entity1Rect = entity1.getBoundingClientRect();
        const entity2Rect = entity2.getBoundingClientRect();
    
        const x1 = entity1Rect.left + entity1Rect.width / 2;
        const y1 = entity1Rect.top + entity1Rect.height / 2;
        const x2 = entity2Rect.left + entity2Rect.width / 2;
        const y2 = entity2Rect.top + entity2Rect.height / 2;
    
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
    
        const offsetX = 100; // Horizontal offset to place comboboxes apart
    
        const comboboxLeft = line.comboboxLeft;
        const comboboxRight = line.comboboxRight;
    
        if (comboboxLeft) {
            comboboxLeft.style.position = "absolute";
            comboboxLeft.style.left = (midX - offsetX) + "px";
            comboboxLeft.style.top = (midY - 20) + "px"; // Adjust as needed to position correctly
        }
    
        if (comboboxRight) {
            comboboxRight.style.position = "absolute";
            comboboxRight.style.left = (midX + offsetX) + "px";
            comboboxRight.style.top = (midY - 20) + "px"; // Adjust as needed to position correctly
        }
    }
    
    function updateEllipsePosition(line) {
        const entity1 = document.getElementById(line.getAttribute("data-entity1"));
        const entity2 = document.getElementById(line.getAttribute("data-entity2"));
        const entity1Rect = entity1.getBoundingClientRect();
        const entity2Rect = entity2.getBoundingClientRect();
    
        const x1 = entity1Rect.left + entity1Rect.width / 2;
        const y1 = entity1Rect.top + entity1Rect.height / 2;
        const x2 = entity2Rect.left + entity2Rect.width / 2;
        const y2 = entity2Rect.top + entity2Rect.height / 2;
    
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
    
        const ellipse = line.ellipse;
        if (ellipse) {
            ellipse.style.left = (midX - 50) + "px"; // Adjust the offset to center the ellipse
            ellipse.style.top = (midY - 25) + "px"; // Adjust the offset to center the ellipse
        }
    }
    
    function createLineBetweenEntities(entity1, entity2, associationName) {
        const rect1 = entity1.getBoundingClientRect();
        const rect2 = entity2.getBoundingClientRect();
        const x1 = rect1.left + rect1.width / 2;
        const y1 = rect1.top + rect1.height / 2;
        const x2 = rect2.left + rect2.width / 2;
        const y2 = rect2.top + rect2.height / 2;
    
        const newLine = document.createElement("div");
        newLine.classList.add("line");
        newLine.style.width = Math.hypot(x2 - x1, y2 - y1) + "px";
        newLine.style.left = x1 + "px";
        newLine.style.top = y1 + "px";
        newLine.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}deg)`;
        
        const newEllipse = document.createElement("div");
        newEllipse.classList.add("ellipse");
        const ellipseSpan = document.createElement("span"); // Création d'un span pour le texte
        ellipseSpan.textContent = associationName;
        newEllipse.appendChild(ellipseSpan); // Ajout du texte dans l'ellipse
    
        newEllipse.style.left = ((x1 + x2) / 2) - 50 + "px";
        newEllipse.style.top = ((y1 + y2) / 2) - 25 + "px";
    
        squareContainer.appendChild(newLine);
        squareContainer.appendChild(newEllipse);
    
        lines.push({ line: newLine, ellipse: newEllipse });
    }
    
    function removeEntity(squareId) {
        const entity = document.getElementById(squareId);
        if (entity) {
            // Remove lines and associated comboboxes
            lines = lines.filter(line => {
                if (line.getAttribute("data-entity1") === squareId || line.getAttribute("data-entity2") === squareId) {
                    if (line.comboboxLeft) {
                        line.comboboxLeft.remove();
                    }
                    if (line.comboboxRight) {
                        line.comboboxRight.remove();
                    }
                    if (line.ellipse) {
                        line.ellipse.remove();
                    }
                    line.remove();
                    return false;
                }
                return true;
            });
    
            entity.remove();
        }
    }
    
    // Close the modal when the user clicks the close button or outside the modal
    document.querySelectorAll('.close').forEach(closeButton => {
        closeButton.addEventListener('click', () => {
            closeButton.closest('.modal').style.display = 'none';
        });
    });
    
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    };
    
    // Récupération des références des boutons
    const okBtn = document.getElementById("okBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    
   
    
    deleteBtn.addEventListener("click", () => {
        // Logique à exécuter lorsque le bouton "Supprimer" est cliqué
        // Par exemple, vous pouvez appeler une fonction pour supprimer l'entité
        deleteEntity();
        modal.style.display = "none"; // Fermer la fenêtre modale après la suppression
    });
    
    // Fonction pour supprimer l'entité (à adapter selon votre application)
    function deleteEntity() {
        // Logique pour supprimer l'entité
        console.log("Entité supprimée !");
    }
    
    function closePage() {
        document.getElementById('entityModal').style.display = 'none';
    }
    
    // Ajoutez un événement de clic à chaque carré pour ouvrir la modal
    document.querySelectorAll('.square').forEach(square => {
        square.addEventListener('click', function() {
            openEntityModal(this); // Passer le carré actuel à la fonction openEntityModal
        });
    });
    
   // Function to update entity data
function updateEntityData(entity, entityName, attributeNames) {
    entity.querySelector('.section-small').textContent = entityName;

    const sectionLarge = entity.querySelector('.section-large');
    sectionLarge.innerHTML = '';

    attributeNames.forEach(attributeName => {
        const attributeElement = document.createElement('div');
        attributeElement.textContent = attributeName;
        sectionLarge.appendChild(attributeElement);
    });
}



document.getElementById('okBtn').addEventListener('click', function() {
    // This event will be handled individually for each entity on double-click
});

function closePage() {
    const entityModal = document.getElementById("entityModal");
    entityModal.style.display = "none";
}

document.addEventListener('DOMContentLoaded', function() {
    var appHistory = JSON.parse(localStorage.getItem('appHistory')) || [];

    // Vérifier si des données sont récupérées correctement
    console.log('appHistory:', appHistory);

    document.getElementById('saveBtn').addEventListener('click', () => {
        const schemaData = {
            squares: [],
            lines: []
        };

        document.querySelectorAll('.square').forEach(square => {
            const squareData = {
                id: square.id,
                name: square.querySelector('.section-small')?.textContent || '',
                attributes: Array.from(square.querySelectorAll('.section-large div')).map(attr => attr.textContent),
                position: {
                    left: square.style.left,
                    top: square.style.top
                }
            };
            schemaData.squares.push(squareData);
        });

        document.querySelectorAll('.line').forEach(line => {
            const lineData = {
                entity1: line.getAttribute('data-entity1'),
                entity2: line.getAttribute('data-entity2'),
                cardinality1: line.querySelector('.comboboxLeft')?.value || '',
                cardinality2: line.querySelector('.comboboxRight')?.value || '',
                associationName: line.querySelector('.ellipse') ? line.querySelector('.ellipse').textContent : ""
            };
            schemaData.lines.push(lineData);
        });

        const appName = localStorage.getItem('currentAppName') || 'Unnamed App';
        const appUrl = 'mcd.html'; // URL par défaut, à ajuster si nécessaire

        // Recherche de l'entrée correspondante dans l'historique des applications
        let foundEntry = appHistory.find(entry => entry.name === appName && entry.url === appUrl);

        if (foundEntry) {
            // Mettre à jour l'entrée existante dans l'historique
            foundEntry.schemaData = schemaData;
        } else {
            // Ajouter une nouvelle entrée dans l'historique
            const schemaId = `schema-${Date.now()}`;
            appHistory.push({
                id: schemaId,
                schemaData: schemaData,
                name: appName,
                url: appUrl
            });
        }

        // Mettre à jour localStorage
        localStorage.setItem('appHistory', JSON.stringify(appHistory));

       

        alert('Schéma sauvegardé avec succès!');
    });
});



    
document.getElementById('generateMcdBtn').addEventListener('click', generateMcdJavaFile);

function generateMcdJavaFile() {
    const schemaData = {
        squares: []
    };

    // Collecte des données de chaque entité depuis le modal
    document.querySelectorAll('.square').forEach(square => {
        const entityName = square.querySelector('.section-small').textContent.trim();
        const attributes = [];

        // Récupérer tous les attributs de l'entité actuelle
        square.querySelectorAll('.section-large div').forEach(attributeDiv => {
            const attributeName = attributeDiv.textContent.trim();
            if (attributeName) {
                // Trouver la ligne correspondant à l'attribut dans le modal
                const attributeRow = document.querySelector(`#entityModal tbody tr:nth-child(${attributes.length + 1})`);
                const isChecked = attributeRow.querySelector('.underline-checkbox').checked;
                const attributeType = attributeRow.querySelector('.attribute-type').value.trim();
                attributes.push({
                    name: attributeName,
                    type: attributeType
                });
            }
        });
               
           

        // Ajouter cette entité avec ses attributs à schemaData
        if (attributes.length > 0) {
            schemaData.squares.push({
                name: entityName,
                attributes: attributes
            });
        } else {
            console.warn(`L'entité "${entityName}" n'a pas d'attributs valides et ne sera pas ajoutée.`);
            // Vous pouvez également choisir de ne pas ajouter cette entité à schemaData si nécessaire
        }
    });

    // Générer le code Java pour chaque entité avec ses attributs
    const zip = new JSZip();
    const backendFolder = zip.folder('backend');
    const frontendFolder = zip.folder('frontend');

    schemaData.squares.forEach(entity => {
        const className = entity.name;
        const attributes = entity.attributes;

        // Génération de la classe de modèle Java
        let classCode = `
package model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
public class ${className} {
    @Id
`;

        attributes.forEach(attr => {
            classCode += `    ${attr.type} ${attr.name};\n`;
        });

        classCode += `}\n`;
        // Génération du DAO
        let daoCode = `
package dao;

import java.util.List;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.cfg.Configuration;

import model.${className};

public class ${className}Dao {
    public List<${className}> getAll${className}s() {
        SessionFactory sessionFactory = new Configuration().configure().buildSessionFactory();
        Session session = sessionFactory.openSession();
        List<${className}> ${className.toLowerCase()}s = session.createQuery("from ${className}", ${className}.class).list();
        session.close();
        return ${className.toLowerCase()}s;
    }

    public ${className} add${className}(${className} ${className.toLowerCase()}) {
        SessionFactory sessionFactory = new Configuration().configure().buildSessionFactory();
        Session session = sessionFactory.openSession();
        Transaction transaction = session.beginTransaction();
        session.persist(${className.toLowerCase()});
        transaction.commit();
        session.close();
        sessionFactory.close();
        return ${className.toLowerCase()};
    }

    public void delete${className}(${className} ${className.toLowerCase()}) {
        SessionFactory sessionFactory = new Configuration().configure().buildSessionFactory();
        Session session = sessionFactory.openSession();
        Transaction transaction = session.beginTransaction();
        session.remove(${className.toLowerCase()});
        transaction.commit();
        session.close();
        sessionFactory.close();
    }
}
`;

        // Génération du Service
        let serviceCode = `
package service;

import java.util.List;

import dao.${className}Dao;
import model.${className};

public class ${className}Service {
    private ${className}Dao ${className.toLowerCase()}Dao;

    public ${className}Service() {
        ${className.toLowerCase()}Dao = new ${className}Dao();
    }

    public List<${className}> getAll${className}s() {
        return ${className.toLowerCase()}Dao.getAll${className}s();
    }

    public ${className} add${className}(${className} ${className.toLowerCase()}) {
        return ${className.toLowerCase()}Dao.add${className}(${className.toLowerCase()});
    }

    public void delete${className}(${className} ${className.toLowerCase()}) {
        ${className.toLowerCase()}Dao.delete${className}(${className.toLowerCase()});
    }
}
`;
 // Code du Controller
 let controllerCode = `
 package controller;
 
 import java.io.IOException;
 import java.io.PrintWriter;
 import java.util.List;
 
 import com.fasterxml.jackson.databind.ObjectMapper;
 
 import jakarta.servlet.ServletException;
 import jakarta.servlet.annotation.WebServlet;
 import jakarta.servlet.http.HttpServlet;
 import jakarta.servlet.http.HttpServletRequest;
 import jakarta.servlet.http.HttpServletResponse;
 import model.${className};
 import service.${className}Service;
 
 @WebServlet("/${className.toLowerCase()}s")
 public class ${className}Controller extends HttpServlet {
     private ${className}Service ${className.toLowerCase()}Service;
 
     @Override
     public void init() throws ServletException {
         ${className.toLowerCase()}Service = new ${className}Service();
     }
 
     @Override
     protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
         resp.setHeader("Access-Control-Allow-Origin", "*");
         List<${className}> ${className.toLowerCase()}s = ${className.toLowerCase()}Service.getAll${className}s();
         ObjectMapper mapper = new ObjectMapper();
         String json${className} = mapper.writeValueAsString(${className.toLowerCase()}s);
         resp.getWriter().write(json${className});
     }
 
     @Override
     protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
         resp.setHeader("Access-Control-Allow-Origin", "*");
         String json${className} = "";
         String line;
         while ((line = req.getReader().readLine()) != null) {
             json${className} += line.trim();
         }
         ObjectMapper mapper = new ObjectMapper();
         ${className} ${className.toLowerCase()} = mapper.readValue(json${className}, ${className}.class);
         ${className} new${className} = ${className.toLowerCase()}Service.add${className}(${className.toLowerCase()});
         if (new${className} != null) {
             PrintWriter response = resp.getWriter();
             response.write(json${className});
         }
     }
 
     @Override
     protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
         // Implement update logic here if needed
     }
 
     @Override
     protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
         resp.setHeader("Access-Control-Allow-Origin", "*");
         String json${className} = "";
         String line;
         while ((line = req.getReader().readLine()) != null) {
             json${className} += line.trim();
         }
         ObjectMapper mapper = new ObjectMapper();
         ${className} ${className.toLowerCase()} = mapper.readValue(json${className}, ${className}.class);
         ${className.toLowerCase()}Service.delete${className}(${className.toLowerCase()});
     }
 }
 `;
// Génération du fichier HTML
let htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${className}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <link rel="stylesheet" href="${className}.css">
    <script src="https://code.jquery.com/jquery-3.7.1.js" integrity="sha256-eKhayi8LEQwp4NKxN+CfCh+3qOVUtJn3QNZ0TciWLP4=" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <script src=" ${className}.js"></script>
</head>
<body>
    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal">Ajouter</button>
    <!-- Modal -->
    <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Ajouter ${className}</h5>
                    <button id="fermer" type="button" data-dismiss="modal">X</button>
                </div>
                <div class="modal-body">
                    <form>
                        <div id="content" class="col">
                            ${attributes.map(attr => `
                                <div class="col">
                                    <input id="${attr.name.toLowerCase()}" type="${attr.type}" class="form-control" placeholder="${attr.name}">
                                </div>
                            `).join('')}
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="ajouter${className}()" data-dismiss="modal">Envoyer</button>
                </div>
            </div>
        </div>
    </div>
    <!-- Fin Modal -->
    <!-- Modal -->
    <div class="modal fade" id="confirmModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Supprimer ${className}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    Voulez-vous vraiment supprimer ${className}?
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Non</button>
                        <button id="oui" type="button" class="btn btn-primary" data-dismiss="modal">Oui</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- Fin Modal -->
        <h1>Liste des ${className}s</h1>
        <table id="table${className}s" class="table table-hover">
            <thead>
                <tr>
                    ${attributes.map(attr => `<th scope="col">${attr.name}</th>`).join('\n')}
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody id="liste${className}s">
    
            </tbody>
        </table>
        <script>
            // JavaScript spécifique à votre page peut être ajouté ici
        </script>
    </body>
    </html>`;
    let cssCode = `
    #table${className} {
        width: 40%;
        text-align: center;
        margin: 20px auto; /* Centrer le tableau avec une marge autour */
    }
    
    #table${className} thead tr {
        background-color: deepskyblue;
        font-size: 26px;
    }
    
    #table${className} tbody tr td {
        font-size: 20px; /* Réduire légèrement la taille de la police pour les cellules du corps */
        padding: 10px; /* Ajouter un espacement interne aux cellules */
    }
    
    #fermer {
        float: right;
        background-color: tomato;
        cursor: pointer; /* Afficher le curseur comme pointeur */
        padding: 5px 10px; /* Ajouter un espacement interne */
        border: none; /* Supprimer le bord */
        color: white; /* Couleur du texte */
    }
    
    input {
        margin-bottom: 10px;
        width: 100%; /* Largeur de l'élément input à 100% pour remplir son conteneur */
        padding: 8px; /* Ajouter un espacement interne aux éléments input */
        box-sizing: border-box; /* Inclure les bordures et le rembourrage dans la largeur et la hauteur totales */
    }
    
    #content {
        padding: 20px; /* Ajouter un espace intérieur */
        text-align: center; /* Centrer le contenu du conteneur */
    }
   
    
    `;
    let jsCode = `
    window.addEventListener('load', () => {
        // Chargement initial des données au chargement de la page
        $.get('http://localhost:8080/Backend/${className.toLowerCase()}s', (data) => {
            const ${className.toLowerCase()}s = JSON.parse(data);
            ${className.toLowerCase()}s.forEach(${className.toLowerCase()} => {
                const ${className.toLowerCase()}Id = ${className.toLowerCase()}.${attributes[0].name.toLowerCase()}; // Assurez-vous que ${attributes[0].name} correspond à votre attribut unique

                function ajouter${className}() {
                    let formData = {};
                    ${attributes.map(attr => `formData["${attr.name.toLowerCase()}"] = $("#${attr.name.toLowerCase()}").val();`).join('\n')}
                    const jsonData = JSON.stringify(formData);
                    $.post("http://localhost:8080/Backend/${className.toLowerCase()}s", jsonData, function (data) {
                        if (data) {
                            const ${className.toLowerCase()}Id = data.id;
                            const ${attributes.map(attr => `const ${attr.name.toLowerCase()}Cell = $('<td>').text(data.${attr.name.toLowerCase()});`).join('\n')}
                            const deleteButton = $('<button>').html('<img class="deleteImage" src="images/delete.png">');
                            deleteButton.addClass('btn btn-danger deleteButton');
                            deleteButton.on('click', function () {
                                delete${className}(${className.toLowerCase()}Id);
                            });
        
                            const deleteTd = $('<td>').append(deleteButton);
                            const row = $('<tr>').attr('id', ${className.toLowerCase()}Id).append(${attributes.map(attr => `${attr.name.toLowerCase()}Cell`).join(', ')}, deleteTd);
                            $('#liste${className.toLowerCase()}s').append(row);
                        }
                    }, "json");
                }
                            
                // Création des cellules de données pour chaque attribut
            // Assuming attributes array has at least three elements
const ${attributes[0].name.toLowerCase()}Cell1 = $('<td>').text(${className.toLowerCase()} && ${className.toLowerCase()}.${attributes.length > 0 ? attributes[0].name.toLowerCase() : ''});


                // Création du bouton de suppression avec gestionnaire d'événements
                const deleteButton = $('<button>').text('Supprimer');
                deleteButton.addClass('btn btn-danger deleteButton'); // Ajout de classes Bootstrap pour styliser le bouton
                deleteButton.on('click', () => delete${className}(${className.toLowerCase()}Id)); // Appel de la fonction delete${className} avec l'ID

                // Cellule pour le bouton de suppression
                const deleteTd = $('<td>').append(deleteButton);

                // Création de la ligne avec toutes les cellules et le bouton de suppression
                const row = $('<tr>').append(${attributes[0].name.toLowerCase()}Cell1, deleteTd);

                // Ajout de la ligne au tableau HTML
                $('#liste${className.toLowerCase()}s').append(row);
            });
        });
    });

    function delete${className}(${className.toLowerCase()}Id) {
        $.ajax({
            url: \`http://localhost:8080/Backend/${className.toLowerCase()}/\${${className.toLowerCase()}Id}\`,
            type: 'DELETE',
            success: function (response) {
                $(\`#\${${className.toLowerCase()}Id}\`).closest('tr').remove(); // Supprime la ligne de la table après suppression réussie
            },
            error: function (xhr, status, error) {
                console.error('Erreur lors de la suppression:', error);
            }
        });
    }
    
     `;

 
        // Ajouter les fichiers Java au dossier backend
        backendFolder.file(`model/${className}.java`, classCode);
        backendFolder.file(`dao/${className}Dao.java`, daoCode);
        backendFolder.file(`service/${className}Service.java`, serviceCode);
        backendFolder.file(`controller/${className}Controller.java`, controllerCode);
        frontendFolder.file(`${className}.html`, htmlCode);
        frontendFolder.file(`${className}.css`, cssCode);
        frontendFolder.file(`${className}.js`, jsCode);

    });

    // Générer le fichier zip et le télécharger
    zip.generateAsync({ type: 'blob' }).then(function (content) {
        downloadFile('codegenrate.zip', content);
    });
}

function downloadFile(filename, content) {
    const url = URL.createObjectURL(new Blob([content]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}




