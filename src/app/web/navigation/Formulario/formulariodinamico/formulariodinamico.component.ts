import { Component, inject, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModuloGeneralModule } from '../../../../shared/modulo-general.module';
import { FormSchema } from '../../../../models/FormularioModal';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../../Api/api.service';
import { GeneralServiceService } from '../../../../GeneralService';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-formulariodinamico',
  imports: [ModuloGeneralModule],
  templateUrl: './formulariodinamico.component.html',
  styleUrl: './formulariodinamico.component.css'
})
export class FormulariodinamicoComponent {
  @Input() formSchema!: FormSchema;
  @Input() Tabla: string = '';
  @Input() crudd: 'C' | 'U' | 'D' = 'C';
  activeModal = inject(NgbActiveModal);
  form!: FormGroup;
  originalData: any;
  TablaForanea: any;
  foreignData: { [key: string]: { value: number; label: string }[] } = {};


  constructor(private fb: FormBuilder, private api: ApiService, private generalService: GeneralServiceService) { }

  ngOnInit(): void {
    this.createForm();
    this.loadForeignKeys();
    this.originalData = { ...this.form.value };

    console.log(this.formSchema);
  }

  createForm(): void {
    const group: any = {};
    this.formSchema.fields.forEach(field => {
      const value = this.castValueByType(field.value, field.type);
      group[field.name] = [value, this.getValidators(field.validators)];
    });
    this.form = this.fb.group(group);
  }

  // castValueByType(value: any, type: string): any {
  //   switch (type) {
  //     case 'number':
  //       // Verifica si el valor es numérico antes de convertir
  //       return isNaN(Number(value)) ? value : Number(value);
  //     case 'boolean':
  //       return value === 'true' || value === true;
  //     case 'string':
  //     default:
  //       return String(value);
  //   }
  // }

  castValueByType(value: any, type: string): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === true;
      case 'string':
      default:
        return String(value);
    }
  }


  getValidators(validators?: string[]) {
    const formValidators: any[] = [];
    if (validators) {
      validators.forEach(v => {
        if (v === 'required') {
          formValidators.push(Validators.required);
        }
        if (v === 'email') {
          formValidators.push(Validators.email);
        }
      });
    }
    return formValidators;
  }

  // onSave(): void {
  //   if (this.form.valid) {
  //     console.log(this.form.value)
  //     this.api.CrearData(this.Tabla, this.form.value).subscribe((data) => {
  //     }, (error) => {
  //       if (error.status == 200) {
  //         this.generalService.showAlert("Se guardo correctamente.", "success", true, 2500).then(() => {
  //           this.activeModal.close();
  //         })
  //       } else {
  //         this.generalService.showAlert("No se pudo guardar la información, intentalo mas tarde.", "error", false, 0)
  //       }
  //     });
  //   } else {
  //     this.form.markAllAsTouched();
  //   }
  // }

  async onSave(): Promise<void> {
    if (this.form.valid) {
      console.log(this.form.value);
      
      try {
        await firstValueFrom(this.api.CrearData(this.Tabla, this.form.value));
        this.generalService.showAlert("Se guardó correctamente.", "success", true, 2500).then(() => {
          this.activeModal.close();
        });
      } catch (error: any) {
        if (error.status === 200) {
          this.generalService.showAlert("Se guardó correctamente.", "success", true, 2500).then(() => {
            this.activeModal.close();
          });
        } else {
          this.generalService.showAlert("No se pudo guardar la información, inténtalo más tarde.", "error", false, 0);
        }
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  onEdit(): void {
    if (this.form.valid) {
      // 1️⃣ Obtener los valores originales del formulario
      const originalData = this.originalData || {}; // Almacenar antes de modificar

      // 2️⃣ Filtrar solo los campos modificados
      const modifiedData = Object.keys(this.form.value).reduce((acc, key) => {
        if (this.form.value[key] !== originalData[key]) {
          acc[key] = this.form.value[key];
        }
        return acc;
      }, {} as any);

      // 3️⃣ Obtener el primer campo clave (antes y después de la edición)
      const firstKey = Object.keys(modifiedData)[0];

      // 4️⃣ Usar el valor original de la clave primaria para el `where`
      const whereKey = firstKey; // Clave a buscar
      const whereValue = originalData[whereKey]; // Valor original (antes de ser modificado)

      if (Object.keys(modifiedData).length > 0) {
        this.api.EditarData(this.Tabla, whereKey, whereValue, modifiedData).subscribe(
          (data) => { },
          (error) => {
            if (error.status == 200) {
              this.generalService.showAlert("Se edito correctamente.", "success", true, 2500).then(() => {
                this.activeModal.close();
              })
            } else {
              this.generalService.showAlert("No se pudo editar la información, intentalo mas tarde.", "error", false, 0)
            }
          }
        );
      } else {
        alert("No hay cambios para actualizar.");
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  onDelete(): void {
    if (this.form.valid) {
      // 1️⃣ Obtener los valores originales del formulario
      const originalData = this.originalData || {}; // Asegurar los datos originales

      // 2️⃣ Obtener la clave primaria (asumiendo que es el primer campo en el formulario)
      const whereKey = Object.keys(originalData)[0]; // Primer campo clave del objeto original
      const whereValue = originalData[whereKey]; // Valor original de la clave primaria

      if (!whereKey || !whereValue) {
        alert("No se pudo determinar el identificador del registro a eliminar.");
        return;
      }

      // 3️⃣ Llamar a la API para eliminar
      this.api.EliminarData(this.Tabla, whereKey, whereValue).subscribe(
        (data) => { },
        (error) => {
          if (error.status == 200) {
            this.generalService.showAlert("Se elimino correctamente.", "success", true, 2500).then(() => {
              this.activeModal.close();
            })
          } else {
            this.generalService.showAlert("No se pudo eliminar la información, intentalo mas tarde.", "error", false, 0)
          }
        }
      );
    } else {
      this.form.markAllAsTouched();
    }
  }


  // En el caso de variablesporindicador y indicadores antes este método no esperaba las respuestas, 
  // ya que mandaba muchas peticiones en al mismo tiempo y el backend a veces no alcanzaba a responder bien, 
  // y causaba errores. Ahora usamos `await` para que cada petición se procese de forma ordenada.
  // Así aseguramos que todos los datos se carguen bien y el formulario funcione completo.
 
  async loadForeignKeys() {
    // Creo un array para almacenar todas las promesas
    const promises = [];   
    // Recorrero todos los campos y generaro promesas
    for (const field of this.formSchema.fields) {
      if (field.fk) {
        // Añado cada promesa al array
        promises.push(
          await this.getForeignData(field.strTable).then(data => {
            this.foreignData[field.name] = data;
            return { field: field.name, data };
          }).catch(error => {
            console.error(`Error cargando datos para ${field.name}:`, error);
            this.foreignData[field.name] = [];
            return { field: field.name, error };
          })
        );
      }
    }    
    // Esperar a que todas las promesas se resuelvan
    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error al cargar datos:', error);
      return [];
    }
  }

    // loadForeignKeys() {
  //   // Simulación de carga dinámica de datos foráneos
  //   for (const field of this.formSchema.fields) {
  //     if (field.fk) {
  //       console.log(field);
  //       this.getForeignData(field.strTable).then(data => {
  //         this.foreignData[field.name] = data;
  //       });
  //     }
  //   }
  // }

  async getForeignData(table: string): Promise<any[]> {
    // Aquí simulas (o llamás a un servicio real) para obtener los datos
    const tabla = await firstValueFrom(this.api.TraerTabla(table));
    return Promise.resolve(tabla || []);
  }

  onFkChange(event: Event, field: any) {
  }

  // Este cambio se hace porque algunas claves foráneas no son números,
  // sino cadenas (como email). Los <select> siempre envían
  // strings, así que hay que aceptar ambos tipos para evitar que salga `NaN`.
  // Ya que se estaban generando errores al insertar una llave foránea tipo email,
  // porque el valor se convertía en `NaN` al enviarlo al backend.

  formatValue(content: any): number | string {
    const keys = Object.keys(content);
    for (const key of keys) {
      const value = Number(content[key]);
      if (!isNaN(value)) return value;
    }
    // convierte el primer campo a string
    return String(content[keys[0]]); 
  }

  // formatValue(content: any): number {
  //   const keys = Object.keys(content);
  //   return Number(content[keys[0]]);
  // }

  formatOption(content: any): string {
    return Object.values(content).join(' - ');
  }

  cancel() {
    this.activeModal.dismiss(false);  // Devuelve false cuando se cancela
  }
}
