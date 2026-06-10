import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Person {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  default_role_id: string | null;
  default_role?: string;
  is_standard: boolean;
  rank: string | null;
}

interface Role {
  id: string;
  role_name: string;
  rank: string | null;
  teken: string | null;
  teken_quantity: number | null;
}

export const exportPeopleToExcel = async (people: Person[], roles: Role[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('רשימת כוח אדם');

  // Set RTL
  worksheet.views = [{ rightToLeft: true }];

  // Define columns
  worksheet.columns = [
    { header: 'דרגה', key: 'rank', width: 10 },
    { header: 'שם פרטי', key: 'first_name', width: 15 },
    { header: 'שם משפחה', key: 'last_name', width: 15 },
    { header: 'תפקיד', key: 'role', width: 20 },
    { header: 'טלפון', key: 'phone', width: 15 },
    { header: 'סטטוס תקן', key: 'is_standard', width: 15 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F81BD' },
  };
  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

  // Add data
  people.forEach((person) => {
    const role = roles.find((r) => r.id === person.default_role_id);
    const row = worksheet.addRow({
      rank: person.rank || '',
      first_name: person.first_name,
      last_name: person.last_name,
      role: role ? role.role_name : person.default_role || '',
      phone: person.phone || '',
      is_standard: person.is_standard ? 'בתקן' : 'מחוץ לתקן',
    });

    // Conditional formatting for standard
    if (!person.is_standard) {
      row.getCell('is_standard').font = { color: { argb: 'FFFF0000' } };
    }
    
    row.alignment = { horizontal: 'right', vertical: 'middle' };
  });

  // Add Summary Section
  worksheet.addRow([]);
  const summaryHeaderRow = worksheet.addRow(['סיכום תקנים']);
  summaryHeaderRow.font = { bold: true, size: 14 };
  
  worksheet.addRow(['תפקיד', 'מאויש בתקן', 'תקן נדרש', 'סטטוס']);
  const subHeaderRow = worksheet.lastRow!;
  subHeaderRow.font = { bold: true };
  subHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' },
  };

  roles.forEach((role) => {
    const occupied = people.filter(
      (p) => p.default_role_id === role.id && p.is_standard
    ).length;
    const required = role.teken_quantity || 0;
    const diff = occupied - required;
    
    let status = 'תקין';
    if (diff < 0) status = `חסר ${Math.abs(diff)}`;
    if (diff > 0) status = `חריגה ${diff}`;

    const row = worksheet.addRow([
      role.role_name,
      occupied,
      required,
      status
    ]);

    if (diff < 0) {
      row.getCell(4).font = { color: { argb: 'FFFF0000' }, bold: true };
    } else if (diff > 0) {
      row.getCell(4).font = { color: { argb: 'FF0070C0' }, bold: true };
    }
  });

  // Borders for all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Generate and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Personnel_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};
