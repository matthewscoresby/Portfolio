package com.example.sigh

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.TextView

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Immutable Variable examples
        // NUMBER BUTTONS
        val button1 = findViewById<TextView>(R.id.button_1);
        val button2 = findViewById<TextView>(R.id.button_2);
        val button3 = findViewById<TextView>(R.id.button_3);
        val button4 = findViewById<TextView>(R.id.button_4);
        val button5 = findViewById<TextView>(R.id.button_5);
        val button6 = findViewById<TextView>(R.id.button_6);
        val button7 = findViewById<TextView>(R.id.button_7);
        val button8 = findViewById<TextView>(R.id.button_8);
        val button9 = findViewById<TextView>(R.id.button_9);

        // TEXT
        val totalText = findViewById<TextView>(R.id.text_total)
        val rightText = findViewById<TextView>(R.id.textRight)
        val leftText = findViewById<TextView>(R.id.textLeft)
        val iconText = findViewById<TextView>(R.id.textIcon)

        // OTHER BUTTONS
        val resetButton = findViewById<Button>(R.id.button_reset)
        val addButton = findViewById<Button>(R.id.button_add)
        val subtractButton = findViewById<Button>(R.id.button_subtract)

        // Mutable Variable examples
        var numbersList = emptyList<Int>()
        var mode = "add"

        // Resets the text and numbersList
        fun reset(){
            totalText.text = "0";
            rightText.text = ""
            leftText.text = ""
            numbersList = emptyList<Int>();
        }

        // Button Listener for 1 - Fires off numButton funciton, if funciton is true then it resets numbersList
        button1.setOnClickListener{
            numbersList = numbersList.plus(1)
            if (numButton(1, numbersList, mode, totalText, rightText, leftText))
            {
                numbersList = emptyList<Int>()
            }
        }

        // Button Listener for 2 - Fires off numButton funciton, if funciton is true then it resets numbersList
        button2.setOnClickListener{
            numbersList = numbersList.plus(2)
            if (numButton(2, numbersList, mode, totalText, rightText, leftText))
            {
                numbersList = emptyList<Int>()
            }
        }

        // Button Listener for 3 - Fires off numButton funciton, if funciton is true then it resets numbersList
        button3.setOnClickListener{
            numbersList = numbersList.plus(3)
            if (numButton(3, numbersList, mode, totalText, rightText, leftText))
            {
                numbersList = emptyList<Int>()
            }
        }

        // Button Listener for 4 - Fires off numButton funciton, if funciton is true then it resets numbersList
        button4.setOnClickListener{
            numbersList = numbersList.plus(4)
            if (numButton(4, numbersList, mode, totalText, rightText, leftText))
            {
                numbersList = emptyList<Int>()
            }
        }

        // Button Listener for 5 - Fires off numButton funciton, if funciton is true then it resets numbersList
        button5.setOnClickListener{
            numbersList = numbersList.plus(5)
            if (numButton(5, numbersList, mode, totalText, rightText, leftText))
            {
                numbersList = emptyList<Int>()
            }
        }

        // Button Listener for 6 - Fires off numButton funciton, if funciton is true then it resets numbersList
        button6.setOnClickListener{
            numbersList = numbersList.plus(6)
            if (numButton(6, numbersList, mode, totalText, rightText, leftText))
            {
                numbersList = emptyList<Int>()
            }
        }

        // Button Listener for 7 - Fires off numButton funciton, if funciton is true then it resets numbersList
        button7.setOnClickListener{
            numbersList = numbersList.plus(7)
            if (numButton(7, numbersList, mode, totalText, rightText, leftText))
            {
                numbersList = emptyList<Int>()
            }
        }

        // Button Listener for 8 - Fires off numButton funciton, if funciton is true then it resets numbersList
        button8.setOnClickListener{
            numbersList = numbersList.plus(8)
            if (numButton(8, numbersList, mode, totalText, rightText, leftText))
            {
                numbersList = emptyList<Int>()
            }
        }

        // Button Listener for 9 - Fires off numButton funciton, if funciton is true then it resets numbersList
        button9.setOnClickListener{
            numbersList = numbersList.plus(9)
            if (numButton(9, numbersList, mode, totalText, rightText, leftText))
            {
                numbersList = emptyList<Int>()
            }
        }

        // Checks to see if resetButton is clicked
        resetButton.setOnClickListener{
            reset()
        }

        // If addButton is clicked and the mode is not add then switch modes
        addButton.setOnClickListener {
            if (mode != "add")
            {
                reset()
                mode = "add"
                iconText.text = "+"
                addButton.setBackgroundColor(getResources().getColor(R.color.green))
                addButton.setBackgroundColor(getResources().getColor(R.color.purple))
            }
        }

        // If subtractButton is clicked and the mode is not subtract then switch modes
        subtractButton.setOnClickListener {
            if (mode != "subtract")
            {
                reset()
                mode = "subtract"
                iconText.text = "-"
                subtractButton.setBackgroundColor(getResources().getColor(R.color.green))
                addButton.setBackgroundColor(getResources().getColor(R.color.purple))
            }
        }


    }
}

fun add(numbers: Collection<Int>): String {
    // Adds the elements in the collection
    return (numbers.elementAt(0) + numbers.elementAt(1)).toString();
}

fun subtract(numbers: Collection<Int>): String {
    // Subtracs the elements in the collection
    return (numbers.elementAt(0) - numbers.elementAt(1)).toString();
}

fun numButton(num: Int, numbersList: Collection<Int>, mode: String, totalText: TextView, rightText: TextView, leftText: TextView): Boolean{
    var full = checkForTwoNumbers(numbersList);
    if (full)
    {
        // Creates calculatedResult
        var calculatedResult = ""

        // Adds or subtracts depending on the mode
        if (mode == "add")
        {
            calculatedResult = add(numbersList)
        }
        else if (mode == "subtract") {
            calculatedResult = subtract(numbersList)
        }

        // Sets Elements on the Screen
        rightText.text = num.toString();
        totalText.text = calculatedResult;
    }
    else
    {
        // Sets Elements on the Screen
        leftText.text = num.toString();
        rightText.text = "";
    }
    return full;
}

fun checkForTwoNumbers(numbers: Collection<Int>): Boolean
{
    // Checks to see if Collection has 2 numbers
    var full = false;
    if (numbers.size == 2) {
        full = true;
    }
    return full
}