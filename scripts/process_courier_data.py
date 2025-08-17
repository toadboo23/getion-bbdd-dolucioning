#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re
from collections import defaultdict

def parse_psql_output(filename):
    """Parse the PostgreSQL output and extract data"""
    
    employees_data = {}
    company_leaves_data = {}
    stats = {}
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by sections
    sections = content.split('\n\n')
    
    for section in sections:
        if 'estado_en_employees' in section:
            # Parse employees data
            lines = section.strip().split('\n')
            for line in lines[2:]:  # Skip header
                if line.strip() and '|' in line:
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) >= 9:
                        id_glovo = parts[0]
                        estado = parts[1]
                        nombre = parts[2]
                        apellido = parts[3]
                        status = parts[4]
                        ciudad = parts[5]
                        horas = parts[6]
                        
                        employees_data[id_glovo] = {
                            'estado_en_employees': estado,
                            'nombre': nombre,
                            'apellido': apellido,
                            'status_employee': status,
                            'ciudad': ciudad,
                            'horas': horas
                        }
        
        elif 'estado_en_company_leaves' in section:
            # Parse company_leaves data
            lines = section.strip().split('\n')
            for line in lines[2:]:  # Skip header
                if line.strip() and '|' in line:
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) >= 8:
                        id_glovo = parts[0]
                        estado = parts[1]
                        tipo_baja = parts[2] if len(parts) > 2 else ''
                        fecha_baja = parts[3] if len(parts) > 3 else ''
                        status_company_leave = parts[4] if len(parts) > 4 else ''
                        
                        company_leaves_data[id_glovo] = {
                            'estado_en_company_leaves': estado,
                            'tipo_baja': tipo_baja,
                            'fecha_baja': fecha_baja,
                            'status_company_leave': status_company_leave
                        }
        
        elif 'categoria' in section and 'cantidad' in section:
            # Parse statistics
            lines = section.strip().split('\n')
            for line in lines[2:]:  # Skip header
                if line.strip() and '|' in line:
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) >= 2:
                        categoria = parts[0]
                        cantidad = parts[1]
                        stats[categoria] = cantidad
    
    return employees_data, company_leaves_data, stats

def generate_csv(employees_data, company_leaves_data, stats):
    """Generate CSV files with the analysis results"""
    
    # Generate first sheet: Comparison with employees table
    with open('courier_analysis_sheet1.csv', 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'id_glovo', 'estado_en_employees', 'nombre', 'apellido', 
            'status_employee', 'ciudad', 'horas', 'estado_en_company_leaves',
            'tipo_baja', 'fecha_baja', 'status_company_leave'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        # Get all unique IDs
        all_ids = set(employees_data.keys()) | set(company_leaves_data.keys())
        
        for id_glovo in sorted(all_ids):
            row = {'id_glovo': id_glovo}
            
            # Add employees data
            if id_glovo in employees_data:
                row.update(employees_data[id_glovo])
            else:
                row.update({
                    'estado_en_employees': 'NO_EN_EMPLOYEES',
                    'nombre': '',
                    'apellido': '',
                    'status_employee': '',
                    'ciudad': '',
                    'horas': ''
                })
            
            # Add company_leaves data
            if id_glovo in company_leaves_data:
                row.update(company_leaves_data[id_glovo])
            else:
                row.update({
                    'estado_en_company_leaves': 'NO_EN_COMPANY_LEAVES',
                    'tipo_baja': '',
                    'fecha_baja': '',
                    'status_company_leave': ''
                })
            
            writer.writerow(row)
    
    # Generate second sheet: Detailed status analysis
    with open('courier_analysis_sheet2.csv', 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'id_glovo', 'nombre', 'apellido', 'status_employee', 'ciudad', 'horas',
            'estado_en_company_leaves', 'tipo_baja', 'fecha_baja', 'status_company_leave',
            'analisis_estado', 'accion_recomendada'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for id_glovo in sorted(all_ids):
            row = {'id_glovo': id_glovo}
            
            # Get employee data
            emp_data = employees_data.get(id_glovo, {})
            cl_data = company_leaves_data.get(id_glovo, {})
            
            row.update({
                'nombre': emp_data.get('nombre', ''),
                'apellido': emp_data.get('apellido', ''),
                'status_employee': emp_data.get('status_employee', ''),
                'ciudad': emp_data.get('ciudad', ''),
                'horas': emp_data.get('horas', ''),
                'estado_en_company_leaves': cl_data.get('estado_en_company_leaves', 'NO_EN_COMPANY_LEAVES'),
                'tipo_baja': cl_data.get('tipo_baja', ''),
                'fecha_baja': cl_data.get('fecha_baja', ''),
                'status_company_leave': cl_data.get('status_company_leave', '')
            })
            
            # Analyze status and recommend action
            status_emp = emp_data.get('status_employee', '')
            status_cl = cl_data.get('status_company_leave', '')
            
            if emp_data.get('estado_en_employees') == 'NO_EN_EMPLOYEES':
                if cl_data.get('estado_en_company_leaves') == 'EN_COMPANY_LEAVES':
                    row['analisis_estado'] = 'EMPLEADO_ELIMINADO_CON_BAJA'
                    row['accion_recomendada'] = 'VERIFICAR_SI_BAJA_ES_CORRECTA'
                else:
                    row['analisis_estado'] = 'EMPLEADO_NO_ENCONTRADO'
                    row['accion_recomendada'] = 'REVISAR_SI_DEBE_ESTAR_ACTIVO'
            else:
                if status_emp == 'active':
                    if cl_data.get('estado_en_company_leaves') == 'EN_COMPANY_LEAVES':
                        row['analisis_estado'] = 'CONFLICTO_ACTIVO_CON_BAJA'
                        row['accion_recomendada'] = 'REVISAR_ESTADO_DE_BAJA'
                    else:
                        row['analisis_estado'] = 'EMPLEADO_ACTIVO_SIN_BAJA'
                        row['accion_recomendada'] = 'ESTADO_CORRECTO'
                elif status_emp == 'penalizado':
                    row['analisis_estado'] = 'EMPLEADO_PENALIZADO'
                    row['accion_recomendada'] = 'VERIFICAR_FECHA_FIN_PENALIZACION'
                elif status_emp == 'it_leave':
                    row['analisis_estado'] = 'EMPLEADO_EN_BAJA_IT'
                    row['accion_recomendada'] = 'VERIFICAR_ESTADO_IT'
                else:
                    row['analisis_estado'] = f'EMPLEADO_ESTADO_{status_emp.upper()}'
                    row['accion_recomendada'] = 'REVISAR_ESTADO_ESPECIFICO'
            
            writer.writerow(row)
    
    # Generate summary report
    with open('courier_analysis_summary.txt', 'w', encoding='utf-8') as f:
        f.write("RESUMEN DEL ANÁLISIS DE COURIER IDs\n")
        f.write("=" * 50 + "\n\n")
        
        f.write("ESTADÍSTICAS GENERALES:\n")
        for categoria, cantidad in stats.items():
            f.write(f"- {categoria}: {cantidad}\n")
        
        f.write(f"\nTOTAL DE IDs ANALIZADOS: {len(all_ids)}\n")
        f.write(f"EN EMPLOYEES: {len([k for k, v in employees_data.items() if v.get('estado_en_employees') == 'EN_EMPLOYEES'])}\n")
        f.write(f"NO EN EMPLOYEES: {len([k for k, v in employees_data.items() if v.get('estado_en_employees') == 'NO_EN_EMPLOYEES'])}\n")
        f.write(f"EN COMPANY_LEAVES: {len([k for k, v in company_leaves_data.items() if v.get('estado_en_company_leaves') == 'EN_COMPANY_LEAVES'])}\n")
        f.write(f"NO EN COMPANY_LEAVES: {len([k for k, v in company_leaves_data.items() if v.get('estado_en_company_leaves') == 'NO_EN_COMPANY_LEAVES'])}\n")
        
        # Count by employee status
        status_counts = defaultdict(int)
        for emp_data in employees_data.values():
            status = emp_data.get('status_employee', '')
            if status:
                status_counts[status] += 1
        
        f.write(f"\nDISTRIBUCIÓN POR ESTADO EN EMPLOYEES:\n")
        for status, count in sorted(status_counts.items()):
            f.write(f"- {status}: {count}\n")

if __name__ == "__main__":
    # Parse the data
    employees_data, company_leaves_data, stats = parse_psql_output('courier_analysis_results.txt')
    
    # Generate CSV files
    generate_csv(employees_data, company_leaves_data, stats)
    
    print("Archivos generados:")
    print("- courier_analysis_sheet1.csv (Comparación con tabla employees)")
    print("- courier_analysis_sheet2.csv (Análisis detallado de estados)")
    print("- courier_analysis_summary.txt (Resumen estadístico)")
